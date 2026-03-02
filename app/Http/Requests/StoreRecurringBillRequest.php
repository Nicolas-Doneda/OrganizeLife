<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRecurringBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],

            //due_day: dia do vencimento, de 1 a 31
            //EXPLICAÇÃO: between:1,31 valida o range
            //Meses com menos de 31 dias são tratados no Service/Controller
            //Exemplo: se due_day = 31 e o mês é fevereiro, ajustamos para 28/29
            'due_day' => ['required', 'integer', 'between:1,31'],

            //expected_amount: valor esperado
            //EXPLICAÇÃO: numeric aceita inteiros e decimais (ex: 1500, 1500.50)
            //min:0 impede valores negativos
            //max:9999999999.99 é o limite do campo decimal(12,2) no banco
            'expected_amount' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],

            //category_id: opcional, mas SE enviado, deve existir na tabela categories
            //EXPLICAÇÃO DO Rule::exists com where:
            //  Não basta existir na tabela — tem que ser do MESMO USUÁRIO
            //  Sem isso, alguém poderia associar uma categoria de OUTRO usuário (bug de segurança!)
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
            'name.required' => 'O nome da conta é obrigatório.',
            'name.max' => 'O nome pode ter no máximo 120 caracteres.',
            'due_day.required' => 'O dia de vencimento é obrigatório.',
            'due_day.between' => 'O dia de vencimento deve ser entre 1 e 31.',
            'expected_amount.required' => 'O valor esperado é obrigatório.',
            'expected_amount.min' => 'O valor não pode ser negativo.',
            'category_id.exists' => 'Categoria não encontrada.',
        ];
    }
}
