<?php

namespace App\Http\Requests;

use App\Models\MonthlyBill;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMonthlyBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name_snapshot' => ['sometimes', 'string', 'max:120'],
            'expected_amount' => ['sometimes', 'numeric', 'min:0', 'max:9999999999.99'],
            'due_date' => ['sometimes', 'date', 'after_or_equal:2020-01-01'],

            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')
                    ->where('user_id', $this->user()->id)
                    ->whereNull('deleted_at'),
            ],

            'status' => [
                'sometimes',
                'string',
                Rule::in(MonthlyBill::VALID_STATUSES),
            ],

            'paid_amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'expected_amount.min' => 'O valor não pode ser negativo.',
            'due_date.date' => 'Data de vencimento inválida.',
            'category_id.exists' => 'Categoria não encontrada.',
            'status.in' => 'Status inválido. Use: pending, paid, overdue ou canceled.',
            'notes.max' => 'As observações podem ter no máximo 1000 caracteres.',
        ];
    }
}
