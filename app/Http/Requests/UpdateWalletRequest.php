<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWalletRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'sometimes',
                'string',
                'max:60',
                Rule::unique('wallets', 'name')
                    ->where('user_id', $this->user()->id)
                    ->whereNull('deleted_at')
                    ->ignore($this->route('wallet')),
            ],
            'color' => [
                'sometimes',
                'string',
                'max:30',
            ],
            'icon' => ['nullable', 'string', 'max:30'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'O nome pode ter no máximo 60 caracteres.',
            'name.unique' => 'Você já tem uma carteira com esse nome.',
            'color.max' => 'Cor inválida.',
        ];
    }
}
