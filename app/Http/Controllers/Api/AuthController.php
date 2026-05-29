<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    //REGISTER - Criar conta
    //EXPLICAÇÃO:
    //  1. RegisterRequest já validou tudo (nome, email único, senha confirmada)
    //  2. User::create() cria o usuário (senha é hasheada automaticamente pelo cast)
    //  3. createToken() gera um token Sanctum para o usuário já logado
    //  4. Retorna o token para o frontend guardar e usar nas próximas requests
    //
    //  POR QUÊ retornar o token no registro?
    //  Para o usuário já ficar logado automaticamente após criar a conta
    //  Sem isso, ele teria que: criar conta → ir pra tela de login → logar
    //  Com token direto = experiência melhor (UX)
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => $request->input('password'),
        ]);

        // Seed default categories for the user
        $defaultCategories = [
            ['name' => 'Alimentação', 'color' => 'orange', 'icon' => 'utensils', 'budget_group' => 'needs'],
            ['name' => 'Moradia', 'color' => 'blue', 'icon' => 'home', 'budget_group' => 'needs'],
            ['name' => 'Transporte', 'color' => 'emerald', 'icon' => 'car', 'budget_group' => 'needs'],
            ['name' => 'Lazer', 'color' => 'rose', 'icon' => 'smile', 'budget_group' => 'wants'],
            ['name' => 'Economias', 'color' => 'violet', 'icon' => 'piggy-bank', 'budget_group' => 'savings'],
        ];
        foreach ($defaultCategories as $category) {
            $user->categories()->create($category);
        }

        //EXPLICAÇÃO: 'auth_token' é o NOME do token (para identificar)
        //Um usuário pode ter vários tokens (desktop, celular, etc)
        //O nome ajuda a saber qual é qual
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Conta criada com sucesso e categorias básicas inicializadas.',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ], 201);
    }

    //LOGIN - Autenticar usuário
    //EXPLICAÇÃO:
    //  1. LoginRequest já verificou rate limiting (5 tentativas/min)
    //  2. Auth::attempt() compara email+senha com o banco
    //  3. Se falhar, incrementa o rate limiter e retorna erro 401
    //  4. Se passar, limpa o rate limiter e gera novo token
    //
    //  POR QUÊ verificar isSuspended()?
    //  Mesmo com email/senha corretos, um usuário suspenso NÃO deve logar
    //  Isso é uma camada EXTRA de segurança (a senha está certa, mas a conta está bloqueada)
    public function login(LoginRequest $request): JsonResponse
    {
        $request->ensureIsNotRateLimited();

        if (! Auth::attempt($request->only('email', 'password'))) {
            $request->hitRateLimiter();

            return response()->json([
                'message' => 'E-mail ou senha incorretos.',
            ], 401);
        }

        $request->clearRateLimiter();

        $user = Auth::user();

        //Verifica se a conta está suspensa
        if ($user->isSuspended()) {
            Auth::logout();

            return response()->json([
                'message' => 'Sua conta está suspensa.',
                'reason' => $user->suspension_reason,
            ], 403);
        }

        //EXPLICAÇÃO: Verifica se o usuário tem 2FA ativo
        //Se tem, NÃO retorna o token ainda!
        //Retorna um token TEMPORÁRIO que só serve para verificar o código 2FA
        //Depois de verificar, aí sim gera o token real
        if ($user->hasTwoFactorEnabled()) {
            $cookieName = '2fa_trust_' . $user->id;
            $trusted = false;
            if ($request->hasCookie($cookieName)) {
                $cookieValue = $request->cookie($cookieName);
                $expectedHash = hash_hmac('sha256', $user->id . '|' . decrypt($user->two_factor_secret), config('app.key'));
                if (hash_equals($expectedHash, (string)$cookieValue)) {
                    $trusted = true;
                }
            }

            if (!$trusted) {
                //Token temporário com habilidades limitadas
                $tempToken = $user->createToken('2fa_temp', ['2fa:verify'])->plainTextToken;

                return response()->json([
                    'message' => 'Verificação de dois fatores necessária.',
                    'requires_2fa' => true,
                    'data' => [
                        'temp_token' => $tempToken,
                    ],
                ], 200);
            }
        }

        //Login normal (sem 2FA ou se dispositivo confiável)
        //EXPLICAÇÃO: Deleta tokens antigos para segurança
        //Se o usuário logou em outro lugar, o token antigo é invalidado
        //Isso garante apenas UMA sessão ativa por vez
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    //LOGOUT - Encerrar sessão
    //EXPLICAÇÃO:
    //  currentAccessToken()->delete() apaga APENAS o token atual
    //  O usuário pode ter tokens em outros dispositivos ativos
    //  Se quiser deslogar de TUDO: $request->user()->tokens()->delete()
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    //ME - Retorna dados do usuário logado
    //EXPLICAÇÃO:
    //  Rota simples mas ESSENCIAL
    //  O frontend chama isso ao abrir o app para saber QUEM está logado
    //  Também serve para verificar se o token ainda é válido
    //  Se o token expirou/foi deletado → 401 (middleware já cuida disso)
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'user' => $user,
                'avatar_url' => $user->getAvatarUrl(),
                'has_2fa' => $user->hasTwoFactorEnabled(),
                'budget_needs_percent' => $user->budget_needs_percent ?? 50,
                'budget_wants_percent' => $user->budget_wants_percent ?? 30,
                'budget_savings_percent' => $user->budget_savings_percent ?? 20,
            ],
        ]);
    }

    //UPDATE PROFILE - Atualizar perfil
    //EXPLICAÇÃO:
    //  Permite mudar nome, avatar (cor ou imagem) e cor do tema
    //  Email e senha têm endpoints separados por segurança
    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'avatar' => ['nullable'],
            'theme_color' => ['sometimes', 'string', 'max:20'],
            'budget_needs_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'budget_wants_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'budget_savings_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
        ]);

        $user = $request->user();

        // Validar soma 100% dos limites do orçamento
        if ($request->hasAny(['budget_needs_percent', 'budget_wants_percent', 'budget_savings_percent'])) {
            $needs = $request->has('budget_needs_percent') ? (float) $request->input('budget_needs_percent') : (float) ($user->budget_needs_percent ?? 50);
            $wants = $request->has('budget_wants_percent') ? (float) $request->input('budget_wants_percent') : (float) ($user->budget_wants_percent ?? 30);
            $savings = $request->has('budget_savings_percent') ? (float) $request->input('budget_savings_percent') : (float) ($user->budget_savings_percent ?? 20);

            if (abs(($needs + $wants + $savings) - 100.0) > 0.01) {
                return response()->json([
                    'message' => 'A soma das metas de orçamento (Essencial, Desejos e Poupança) deve ser exatamente 100%. Atualmente a soma é ' . ($needs + $wants + $savings) . '%.',
                ], 422);
            }
        }

        if ($request->filled('name')) {
            $user->name = $request->input('name');
        }

        if ($request->filled('theme_color')) {
            $user->theme_color = $request->input('theme_color');
        }

        if ($request->has('budget_needs_percent')) {
            $user->budget_needs_percent = $request->input('budget_needs_percent');
        }
        if ($request->has('budget_wants_percent')) {
            $user->budget_wants_percent = $request->input('budget_wants_percent');
        }
        if ($request->has('budget_savings_percent')) {
            $user->budget_savings_percent = $request->input('budget_savings_percent');
        }

        // Avatar: pode ser file upload (imagem) ou string (cor hex)
        if ($request->hasFile('avatar')) {
            $request->validate([
                'avatar' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            ]);

            // Deletar avatar antigo se era um arquivo
            if ($user->avatar && !str_starts_with($user->avatar, '#') && \Storage::disk('public')->exists($user->avatar)) {
                \Storage::disk('public')->delete($user->avatar);
            }

            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $path;
        } elseif ($request->filled('avatar')) {
            // String (cor hex) — valida formato para segurança
            $request->validate([
                'avatar' => ['string', 'max:20', 'regex:/^#[a-fA-F0-9]{3,8}$/'],
            ], [
                'avatar.regex' => 'Formato de cor inválido. Use formato hex (ex: #FF5733).',
            ]);
            $user->avatar = $request->input('avatar');
        }

        $user->save();

        return response()->json([
            'message' => 'Perfil atualizado com sucesso.',
            'data' => $user->fresh(),
        ]);
    }

    //CHANGE PASSWORD - Mudar senha (precisa da senha atual)
    //EXPLICAÇÃO:
    //  'current_password' = regra especial do Laravel
    //  Verifica automaticamente se a senha atual está correta
    //  Sem isso, qualquer pessoa com acesso ao token poderia mudar a senha
    //  Exigir a senha atual é uma camada EXTRA de segurança
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'current_password.current_password' => 'A senha atual está incorreta.',
            'password.min' => 'A nova senha deve ter no mínimo 8 caracteres.',
            'password.confirmed' => 'A confirmação de senha não confere.',
        ]);

        $request->user()->update([
            'password' => $request->input('password'),
        ]);

        //EXPLICAÇÃO: Deleta TODOS os tokens após mudar a senha
        //Isso força o logout em todos os dispositivos
        //O usuário precisará logar novamente com a nova senha
        //Isso é segurança padrão (Gmail, Facebook fazem igual)
        $request->user()->tokens()->delete();
        $token = $request->user()->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Senha alterada com sucesso. Todos os dispositivos foram desconectados.',
            'data' => [
                'token' => $token,
            ],
        ]);
    }
}
