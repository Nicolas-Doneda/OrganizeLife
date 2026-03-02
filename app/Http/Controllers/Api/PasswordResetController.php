<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    //FORGOT PASSWORD - Enviar link de recuperação por email
    //EXPLICAÇÃO:
    //  Password::sendResetLink() é o método oficial do Laravel
    //  Ele cria um token na tabela password_reset_tokens (que já criamos na migration)
    //  E envia um email com o link para resetar a senha
    //
    //  POR QUÊ retornamos SEMPRE 200, mesmo se o email não existir?
    //  SEGURANÇA! Se retornássemos erro para emails inexistentes,
    //  um atacante poderia descobrir quais emails estão cadastrados
    //  Isso se chama "User Enumeration Attack"
    //  Respondendo sempre 200, o atacante não sabe se o email existe ou não
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
        ], [
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Formato de e-mail inválido.',
        ]);

        Password::sendResetLink(
            $request->only('email')
        );

        //SEMPRE retorna sucesso (segurança contra user enumeration)
        return response()->json([
            'message' => 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.',
        ]);
    }

    //RESET PASSWORD - Redefinir senha usando token do email
    //EXPLICAÇÃO:
    //  O usuário clicou no link do email que contém o token
    //  O frontend pega esse token e envia junto com a nova senha
    //  Password::reset() verifica se o token é válido e não expirou
    //  Se válido, atualiza a senha e gera novo remember_token
    //
    //  remember_token é diferente do token de reset!
    //  remember_token = usado pelo "Lembrar de mim" no login
    //  Regerar ele força logout de sessões com "Lembrar de mim" ativo
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'password.min' => 'A nova senha deve ter no mínimo 8 caracteres.',
            'password.confirmed' => 'A confirmação de senha não confere.',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                //EXPLICAÇÃO: Deleta TODOS os tokens do Sanctum
                //Isso invalida todas as sessões ativas
                //O usuário precisará logar com a nova senha
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Senha redefinida com sucesso. Faça login com a nova senha.',
            ]);
        }

        return response()->json([
            'message' => 'Não foi possível redefinir a senha. O link pode ter expirado.',
        ], 400);
    }
}
