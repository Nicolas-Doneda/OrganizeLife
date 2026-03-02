<?php

namespace App\Http\Requests;

use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'all_day' => ['sometimes', 'boolean'],
            'start_date' => ['sometimes', 'date', 'after_or_equal:2020-01-01'],

            //EXPLICAÇÃO: No update, end_date precisa validar contra start_date
            //Se start_date não foi enviado no request, usa o valor atual do banco
            //Por isso usamos uma string dinâmica aqui
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],

            'reminder_at' => ['nullable', 'date'],

            'priority' => [
                'sometimes',
                'integer',
                Rule::in(Event::VALID_PRIORITIES),
            ],

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
            'title.max' => 'O título pode ter no máximo 120 caracteres.',
            'description.max' => 'A descrição pode ter no máximo 2000 caracteres.',
            'start_date.date' => 'Data de início inválida.',
            'end_date.after_or_equal' => 'A data de fim deve ser igual ou posterior à data de início.',
            'reminder_at.date' => 'Data do lembrete inválida.',
            'priority.in' => 'Prioridade inválida. Use: 1 (alta), 2 (normal) ou 3 (baixa).',
        ];
    }
}
