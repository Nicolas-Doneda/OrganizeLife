<?php

namespace App\Http\Requests;

use App\Models\MonthlyBill;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMonthlyBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            //year: ano da referência (ex: 2026)
            //EXPLICAÇÃO: digits:4 garante exatamente 4 dígitos
            //min:2020 e max:2100 são limites razoáveis para o sistema
            'year' => ['required', 'integer', 'digits:4', 'min:2020', 'max:2100'],

            //month: mês da referência (1 a 12)
            'month' => ['required', 'integer', 'between:1,12'],

            //name_snapshot: nome da conta naquele mês
            //EXPLICAÇÃO: "snapshot" porque é uma cópia congelada do nome
            //Se a conta recorrente mudar de nome, o histórico não muda
            'name_snapshot' => ['required', 'string', 'max:120'],

            'expected_amount' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],

            //due_date: data completa de vencimento (ex: 2026-02-15)
            //EXPLICAÇÃO: 'date' valida formato de data
            //'after_or_equal:2020-01-01' impede datas absurdas
            'due_date' => ['required', 'date', 'after_or_equal:2020-01-01'],

            //source_uid: identificador único para evitar duplicatas
            //EXPLICAÇÃO: Gerado automaticamente pelo sistema
            //Formato: "recurring_{id}_{year}_{month}" ou "manual_{timestamp}"
            //O controller vai preencher se não for enviado
            'source_uid' => ['nullable', 'string', 'max:191'],

            //recurring_bill_id: se veio de uma recorrente
            'recurring_bill_id' => [
                'nullable',
                'integer',
                Rule::exists('recurring_bills', 'id')
                    ->where('user_id', $this->user()->id)
                    ->whereNull('deleted_at'),
            ],

            //category_id: categoria da conta
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')
                    ->where('user_id', $this->user()->id)
                    ->whereNull('deleted_at'),
            ],

            //status: deve ser um dos status válidos definidos no Model
            //EXPLICAÇÃO: Rule::in() com as constantes do Model
            //Garante que só aceita 'pending', 'paid', 'overdue', 'canceled'
            'status' => [
                'sometimes',
                'string',
                Rule::in(MonthlyBill::VALID_STATUSES),
            ],

            'paid_amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'notes' => ['nullable', 'string', 'max:1000'],

            //wallet_id: carteira/forma de pagamento (opcional)
            'wallet_id' => [
                'nullable',
                'integer',
                Rule::exists('wallets', 'id')
                    ->where('user_id', $this->user()->id)
                    ->whereNull('deleted_at'),
            ],

            // Installment properties
            'is_installment' => ['sometimes', 'boolean'],
            'installments_count' => ['required_if:is_installment,true', 'integer', 'min:2', 'max:120'],
        ];
    }

    public function messages(): array
    {
        return [
            'year.required' => 'O ano é obrigatório.',
            'year.digits' => 'O ano deve ter 4 dígitos.',
            'month.required' => 'O mês é obrigatório.',
            'month.between' => 'O mês deve ser entre 1 e 12.',
            'name_snapshot.required' => 'O nome da conta é obrigatório.',
            'expected_amount.required' => 'O valor esperado é obrigatório.',
            'expected_amount.min' => 'O valor não pode ser negativo.',
            'due_date.required' => 'A data de vencimento é obrigatória.',
            'due_date.date' => 'Data de vencimento inválida.',
            'recurring_bill_id.exists' => 'Conta recorrente não encontrada.',
            'category_id.exists' => 'Categoria não encontrada.',
            'status.in' => 'Status inválido. Use: pending, paid, overdue ou canceled.',
            'notes.max' => 'As observações podem ter no máximo 1000 caracteres.',
            'installments_count.required_if' => 'O número de parcelas é obrigatório.',
            'installments_count.min' => 'O número de parcelas deve ser pelo menos 2.',
            'installments_count.max' => 'O limite máximo é de 120 parcelas.',
        ];
    }
}
