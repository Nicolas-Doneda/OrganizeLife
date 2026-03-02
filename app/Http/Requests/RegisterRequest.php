<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],

            //email: único na tabela users
            //EXPLICAÇÃO: 'email:rfc,dns' é mais rigoroso que apenas 'email'
            //  'rfc' = valida formato conforme RFC 5321
            //  'dns' = verifica se o domínio do email REALMENTE EXISTE
            //  Isso bloqueia emails inventados como "teste@aaabbbccc.com"
            //  Em produção, isso faz uma consulta DNS real
            'email' => ['required', 'string', 'email:rfc,dns', 'max:255', 'unique:users,email'],

            //password: segurança profissional
            //EXPLICAÇÃO:
            //  'min:8' = mínimo 8 caracteres
            //  'confirmed' = exige campo 'password_confirmation' igual
            //  O Laravel faz hash automaticamente por causa do cast 'hashed'
            //  no Model User (não precisamos fazer bcrypt() manual)
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome é obrigatório.',
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Formato de e-mail inválido.',
            'email.unique' => 'Este e-mail já está em uso.',
            'password.required' => 'A senha é obrigatória.',
            'password.min' => 'A senha deve ter no mínimo 8 caracteres.',
            'password.confirmed' => 'A confirmação de senha não confere.',
        ];
    }
}
