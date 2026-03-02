<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRecurringBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:120'],
            'due_day' => ['sometimes', 'integer', 'between:1,31'],
            'expected_amount' => ['sometimes', 'numeric', 'min:0', 'max:9999999999.99'],

            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')
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
            'due_day.between' => 'O dia de vencimento deve ser entre 1 e 31.',
            'expected_amount.min' => 'O valor não pode ser negativo.',
            'category_id.exists' => 'Categoria não encontrada.',
        ];
    }
}
