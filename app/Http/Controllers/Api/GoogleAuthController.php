<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class GoogleAuthController extends Controller
{
    /**
     * Retorna o driver do Google com Guzzle configurado para o ambiente local (sem verificação SSL).
     */
    private function googleDriver()
    {
        $driver = Socialite::driver('google')->stateless();

        // Em ambiente local (Windows), o PHP não tem o bundle de certificados CA.
        // Desabilitamos a verificação SSL apenas em desenvolvimento.
        if (app()->environment('local')) {
            $driver->setHttpClient(new \GuzzleHttp\Client([
                'verify' => false,
            ]));
        }

        return $driver;
    }

    /**
     * Retorna a URL de redirecionamento para a tela de login do Google.
     */
    public function getRedirectUrl()
    {
        try {
            $url = $this->googleDriver()->redirect()->getTargetUrl();
            return response()->json(['url' => $url]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Não foi possível gerar a URL do Google', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * Lida com o Callback do Google e redireciona com um código temporário de uso único.
     */
    public function handleCallback(Request $request)
    {
        try {
            $googleUser = $this->googleDriver()->user();

            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // Atualiza o google_id se o usuário já existia pelo email, mas não tinha google_id vinculado
                if (!$user->google_id) {
                    $user->update(['google_id' => $googleUser->getId()]);
                }
            } else {
                // Cria um novo usuário
                $user = User::create([
                    'name' => $googleUser->getName() ?? $googleUser->getNickname() ?? 'Google User',
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'password' => Hash::make(Str::random(16)),
                    'avatar' => $this->cloneAvatar($googleUser->getAvatar()),
                    'email_verified_at' => now(), // Assume o email do Google como verificado
                ]);

                // Seed default categories for the new user
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
            }

            if ($user->isSuspended()) {
                $frontendErrorUrl = env('APP_URL', 'http://127.0.0.1:8000') . '/login?error=account_suspended';
                return redirect($frontendErrorUrl);
            }

            // Gera um código de uso único válido por 60 segundos
            $exchangeCode = Str::random(40);
            Cache::put('google_auth_code_' . $exchangeCode, $user->id, 60);

            // Retorna redirecionando para a rota do React Router com o código de troca seguro na URL (S4)
            $frontendUrl = env('APP_URL', 'http://127.0.0.1:8000') . '/google-callback?code=' . $exchangeCode;
            return redirect($frontendUrl);

        } catch (\Exception $e) {
            $frontendErrorUrl = env('APP_URL', 'http://127.0.0.1:8000') . '/login?error=google_auth_failed';
            return redirect($frontendErrorUrl);
        }
    }

    /**
     * Troca o código temporário do Google OAuth pelo token Sanctum final.
     */
    public function exchangeCode(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $code = $request->input('code');
        $userId = Cache::pull('google_auth_code_' . $code);

        if (!$userId) {
            return response()->json([
                'message' => 'Código de autenticação inválido ou expirado.',
            ], 400);
        }

        $user = User::findOrFail($userId);

        if ($user->isSuspended()) {
            return response()->json([
                'message' => 'Sua conta está suspensa.',
                'reason' => $user->suspension_reason,
            ], 403);
        }

        if ($user->hasTwoFactorEnabled()) {
            $cookieName = '2fa_trust_' . $user->id;
            $trusted = false;
            if ($request->hasCookie($cookieName)) {
                $cookieValue = $request->cookie($cookieName);
                $expectedHash = hash_hmac('sha256', $user->id . '|' . decrypt($user->two_factor_secret), config('app.key'));
                if (hash_equals($expectedHash, (string) $cookieValue)) {
                    $trusted = true;
                }
            }

            if (!$trusted) {
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

        // Revoga tokens antigos caso exista a regra de 1 login
        $user->tokens()->delete();

        // Gera o token de acesso definitivo
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Autenticação concluída com sucesso.',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    /**
     * Auxiliar para clonar imagem de perfil.
     */
    private function cloneAvatar($url)
    {
        if (!$url) return null;
        return $url;
    }
}
