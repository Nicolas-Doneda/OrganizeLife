<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRecurringIncomeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:120'],
            'receive_day' => ['sometimes', 'integer', 'between:1,31'],
            'amount' => ['sometimes', 'numeric', 'min:0.01', 'max:9999999999.99'],
            'wallet_id' => [
                'nullable',
                'integer',
                Rule::exists('wallets', 'id')
                    ->where('user_id', $this->user()->id)
                    ->whereNull('deleted_at'),
            ],
            'active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'O nome pode ter no máximo 120 caracteres.',
            'receive_day.between' => 'O dia de recebimento deve ser entre 1 e 31.',
            'amount.min' => 'O valor deve ser de pelo menos R$ 0,01.',
            'wallet_id.exists' => 'Carteira não encontrada.',
        ];
    }
}
