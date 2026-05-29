<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRecurringIncomeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'receive_day' => ['required', 'integer', 'between:1,31'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999.99'],
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
            'name.required' => 'O nome é obrigatório.',
            'name.max' => 'O nome pode ter no máximo 120 caracteres.',
            'receive_day.required' => 'O dia de recebimento é obrigatório.',
            'receive_day.between' => 'O dia de recebimento deve ser entre 1 e 31.',
            'amount.required' => 'O valor é obrigatório.',
            'amount.min' => 'O valor deve ser de pelo menos R$ 0,01.',
            'wallet_id.exists' => 'Carteira não encontrada.',
        ];
    }
}
