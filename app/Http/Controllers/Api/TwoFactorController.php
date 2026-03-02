<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    //ENABLE - Gerar secret do 2FA
    //EXPLICAÇÃO:
    //  Passo 1: O usuário clica "Ativar 2FA" no frontend
    //  O sistema gera um secret aleatório (string de 32 chars)
    //  E retorna um QR Code URL para o Google Authenticator
    //  O usuário escaneia o QR Code no app
    //  Depois precisa CONFIRMAR com um código para ativar de verdade
    //
    //  POR QUÊ não ativar direto?
    //  Se o secret fosse salvo como "ativo" sem confirmar,
    //  o usuário poderia perder acesso se não conseguiu escanear o QR Code
    //  O fluxo correto é: gerar → escanear → confirmar com código → ativar
    public function enable(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => 'A verificação de dois fatores já está ativa.',
            ], 400);
        }

        //EXPLICAÇÃO: Geramos um secret base32 de 16 bytes (32 chars)
        //Esse é o padrão usado pelo Google Authenticator
        //Na prática, em produção usaríamos um pacote como
        //pragmarx/google2fa-laravel, mas aqui faremos manualmente
        //para fins de aprendizado
        $google2fa = new Google2FA();
        $secret = $google2fa->generateSecretKey();

        //Salva o secret mas NÃO confirma ainda
        $user->update([
            'two_factor_secret' => encrypt($secret),
            'two_factor_confirmed_at' => null,
        ]);

        //EXPLICAÇÃO: Gera códigos de recuperação
        //Se o usuário perder o celular, pode usar um desses códigos
        //São códigos de uso ÚNICO (cada um funciona 1 vez só)
        $recoveryCodes = $this->generateRecoveryCodes();
        $user->update([
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
        ]);

        //EXPLICAÇÃO: otpauth URI é o formato padrão para QR Codes de 2FA
        //O Google Authenticator lê essa URL e configura automaticamente
        $otpauthUrl = 'otpauth://totp/OrganizeLife:' . urlencode($user->email)
            . '?secret=' . $secret
            . '&issuer=OrganizeLife'
            . '&digits=6'
            . '&period=30';

        return response()->json([
            'message' => 'Escaneie o QR Code no Google Authenticator.',
            'data' => [
                'secret' => $secret,
                'otpauth_url' => $otpauthUrl,
                'recovery_codes' => $recoveryCodes,
            ],
        ]);
    }

    //CONFIRM - Confirmar ativação do 2FA
    //EXPLICAÇÃO:
    //  Passo 2: O usuário digitou o código de 6 dígitos do Google Authenticator
    //  Verificamos se o código está correto
    //  Se sim, marcamos two_factor_confirmed_at (agora está REALMENTE ativo)
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ], [
            'code.required' => 'O código é obrigatório.',
            'code.size' => 'O código deve ter 6 dígitos.',
        ]);

        $user = $request->user();

        if ($user->two_factor_secret === null) {
            return response()->json([
                'message' => 'Inicie a ativação do 2FA primeiro.',
            ], 400);
        }

        if ($user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => 'O 2FA já está confirmado e ativo.',
            ], 400);
        }

        //EXPLICAÇÃO: Valida o código TOTP usando google2fa
        //O código muda a cada 30 segundos baseado no secret + timestamp
        $google2fa = new Google2FA();
        $secret = decrypt($user->two_factor_secret);

        if (! $google2fa->verifyKey($secret, $request->input('code'))) {
            return response()->json([
                'message' => 'Código inválido. Verifique o Google Authenticator e tente novamente.',
            ], 422);
        }

        $user->update([
            'two_factor_confirmed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Verificação de dois fatores ativada com sucesso!',
        ]);
    }

    //DISABLE - Desativar 2FA
    //EXPLICAÇÃO:
    //  Remove o secret e os códigos de recuperação
    //  Exige a senha atual para segurança extra
    //  Sem isso, qualquer pessoa com o token poderia desativar o 2FA
    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ], [
            'password.current_password' => 'Senha incorreta.',
        ]);

        $request->user()->update([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);

        return response()->json([
            'message' => 'Verificação de dois fatores desativada.',
        ]);
    }

    //VERIFY - Verificar código 2FA no login
    //EXPLICAÇÃO:
    //  Passo final do login quando 2FA está ativo
    //  O usuário já passou email+senha (recebeu temp_token)
    //  Agora precisa digitar o código do Google Authenticator
    //  Se correto, deleta o temp_token e gera o token REAL
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ], [
            'code.required' => 'O código é obrigatório.',
            'code.size' => 'O código deve ter 6 dígitos.',
        ]);

        $user = $request->user();

        //EXPLICAÇÃO: Verifica se o token atual é o temporário do 2FA
        //O temp_token tem a ability '2fa:verify' (definida no AuthController)
        //Se não tem essa ability, é um token normal tentando acessar essa rota
        if (! $user->currentAccessToken()->can('2fa:verify')) {
            return response()->json([
                'message' => 'Token inválido para verificação 2FA.',
            ], 403);
        }

        //EXPLICAÇÃO: Valida o código TOTP real
        $google2fa = new Google2FA();
        $secret = decrypt($user->two_factor_secret);

        if (! $google2fa->verifyKey($secret, $request->input('code'))) {
            return response()->json([
                'message' => 'Código 2FA inválido.',
            ], 422);
        }

        //EXPLICAÇÃO: Deleta o token temporário e cria o token real
        //O token real NÃO tem restrições de abilities
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Verificação 2FA realizada com sucesso.',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    //RECOVERY - Login usando código de recuperação
    //EXPLICAÇÃO:
    //  Se o usuário perdeu o celular e não tem o Google Authenticator
    //  Pode usar um dos 8 códigos de recuperação gerados na ativação
    //  Cada código funciona UMA vez (é removido após o uso)
    public function recovery(Request $request): JsonResponse
    {
        $request->validate([
            'recovery_code' => ['required', 'string'],
        ]);

        $user = $request->user();

        $recoveryCodes = json_decode(
            decrypt($user->two_factor_recovery_codes),
            true
        );

        $code = $request->input('recovery_code');

        if (! in_array($code, $recoveryCodes)) {
            return response()->json([
                'message' => 'Código de recuperação inválido.',
            ], 400);
        }

        //EXPLICAÇÃO: Remove o código usado (single-use)
        //array_values() reindexa o array após o filter
        $recoveryCodes = array_values(
            array_filter($recoveryCodes, fn ($c) => $c !== $code)
        );

        $user->update([
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
        ]);

        //Gera token real (bypass do 2FA)
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login por recuperação realizado. Restam ' . count($recoveryCodes) . ' códigos.',
            'data' => [
                'user' => $user,
                'token' => $token,
                'remaining_codes' => count($recoveryCodes),
            ],
        ]);
    }

    //MÉTODOS PRIVADOS (helpers internos)

    //EXPLICAÇÃO: generateBase32Secret removido — agora usamos google2fa->generateSecretKey()

    //EXPLICAÇÃO: Gera 8 códigos de recuperação aleatórios
    //Formato: XXXX-XXXX (fácil de ler e digitar)
    //random_int() é criptograficamente seguro (melhor que rand())
    private function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];

        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(
                Str::random(4) . '-' . Str::random(4)
            );
        }

        return $codes;
    }
}
