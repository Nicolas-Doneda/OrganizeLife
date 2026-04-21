<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
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
     * Lida com o Callback do Google e retorna o Token de acesso.
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
                    'avatar' => cloneAvatar($googleUser->getAvatar()),
                    'email_verified_at' => now(), // Assume o email do Google como verificado
                ]);

            }

            // Revoga tokens antigos caso exista a regra de 1 login
            $user->tokens()->delete();

            // Gera o Token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Retorna redirecionando para a rota do React Router com o token na URL
            $frontendUrl = env('APP_URL', 'http://127.0.0.1:8000') . '/google-callback?token=' . $token;
            return redirect($frontendUrl);

        } catch (\Exception $e) {
            $frontendErrorUrl = env('APP_URL', 'http://127.0.0.1:8000') . '/login?error=google_auth_failed';
            return redirect($frontendErrorUrl);
        }
    }
}

function cloneAvatar($url) {
    if (!$url) return null;
    return $url; // Aqui estamos apenas passando a URL gerada pelo Google. Se necessário pode ser baixado pro storage interno.
}
