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
            //EXPLICAÇÃO: 'email:rfc' valida o formato.
            //  O DNS foi removido pois causa timeout local dependendo da internet.
            //  Regex implementado para forçar apenas domínios reais conhecidos, conforme solicitado.
            'email' => [
                'required', 
                'string', 
                'email:rfc', 
                'max:255', 
                'unique:users,email',
                'regex:/@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com)$/i'
            ],

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
            'email.regex' => 'Apenas e-mails do Gmail, Hotmail, Outlook ou Yahoo são permitidos.',
            'password.required' => 'A senha é obrigatória.',
            'password.min' => 'A senha deve ter no mínimo 8 caracteres.',
            'password.confirmed' => 'A confirmação de senha não confere.',
        ];
    }
}
