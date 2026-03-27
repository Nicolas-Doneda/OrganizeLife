<?php

namespace App\Http\Requests;

use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        \Illuminate\Support\Facades\Log::error('Event Validation Failed', [
            'input' => $this->all(),
            'errors' => $validator->errors()->toArray()
        ]);
        parent::failedValidation($validator);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],

            //all_day: evento de dia inteiro?
            //EXPLICAÇÃO: boolean aceita true, false, 1, 0, "1", "0"
            //Laravel converte tudo para true/false automaticamente
            'all_day' => ['sometimes', 'boolean'],

            //start_date: data de início obrigatória
            //EXPLICAÇÃO: 'date' aceita vários formatos (Y-m-d, d/m/Y, etc)
            //Laravel converte automaticamente para o formato do banco
            'start_date' => ['required', 'date', 'after_or_equal:2020-01-01'],

            //end_date: data de fim (opcional, apenas para eventos multi-dia)
            //EXPLICAÇÃO: 'after_or_equal:start_date' garante que o fim
            //não pode ser ANTES do início (validação lógica importante!)
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],

            //reminder_at: quando enviar lembrete
            //EXPLICAÇÃO: datetime completo porque precisa de hora
            //Exemplo: "2026-02-15 13:00:00" (lembrar 1h antes do evento)
            'reminder_at' => ['nullable', 'date'],

            //priority: nível de importância (1=alta, 2=normal, 3=baixa)
            //EXPLICAÇÃO: Rule::in() com constantes do Model
            //Aceita apenas 1, 2 ou 3 — nenhum valor inventado
            'priority' => [
                'sometimes',
                'integer',
                Rule::in(Event::VALID_PRIORITIES),
            ],

            // Campos de recorrência
            'recurrence_type' => ['sometimes', 'string', Rule::in(['none', 'daily', 'weekly', 'biweekly', 'monthly', 'custom'])],
            'recurrence_interval' => ['nullable', 'integer', 'min:1', 'max:365'],
            'recurrence_days' => ['nullable', 'array'],
            'recurrence_days.*' => ['integer', 'min:0', 'max:6'],
            'recurrence_end' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'O título do evento é obrigatório.',
            'title.max' => 'O título pode ter no máximo 120 caracteres.',
            'description.max' => 'A descrição pode ter no máximo 2000 caracteres.',
            'start_date.required' => 'A data de início é obrigatória.',
            'start_date.date' => 'Data de início inválida.',
            'end_date.after_or_equal' => 'A data de fim deve ser igual ou posterior à data de início.',
            'reminder_at.date' => 'Data do lembrete inválida.',
            'priority.in' => 'Prioridade inválida. Use: 1 (alta), 2 (normal) ou 3 (baixa).',
        ];
    }
}
