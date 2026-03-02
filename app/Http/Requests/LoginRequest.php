<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    //EXPLICAÇÃO: Rate Limiting (proteção contra brute force)
    //Um atacante pode tentar milhares de senhas por segundo
    //Com rate limiting, limitamos a 5 tentativas por minuto
    //Depois disso, bloqueia por 60 segundos
    //A chave usa email + IP para não afetar outros usuários
    public function ensureIsNotRateLimited(): void
    {
        $throttleKey = $this->throttleKey();

        if (! RateLimiter::tooManyAttempts($throttleKey, 5)) {
            return;
        }

        $seconds = RateLimiter::availableIn($throttleKey);

        throw ValidationException::withMessages([
            'email' => [
                "Muitas tentativas de login. Tente novamente em {$seconds} segundos.",
            ],
        ]);
    }

    //EXPLICAÇÃO: Incrementa o contador de tentativas
    //Chamado quando o login FALHA
    public function hitRateLimiter(): void
    {
        RateLimiter::hit($this->throttleKey(), 60);
    }

    //EXPLICAÇÃO: Reseta o contador quando login é BEM SUCEDIDO
    public function clearRateLimiter(): void
    {
        RateLimiter::clear($this->throttleKey());
    }

    //EXPLICAÇÃO: Chave única para o rate limiter
    //Combina email + IP, assim:
    //  - Mesmo email de IPs diferentes = contadores separados
    //  - Mesmo IP tentando emails diferentes = contadores separados
    //Str::transliterate() remove acentos (evita bypass com unicode)
    //Str::lower() normaliza para minúsculo
    private function throttleKey(): string
    {
        return Str::transliterate(
            Str::lower($this->string('email')) . '|' . $this->ip()
        );
    }

    public function messages(): array
    {
        return [
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Formato de e-mail inválido.',
            'password.required' => 'A senha é obrigatória.',
        ];
    }
}
