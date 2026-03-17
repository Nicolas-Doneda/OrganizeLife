<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIncomeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'type' => ['sometimes', 'string', 'in:fixed,variable'],
            'expected_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'string', 'in:pending,received'],
            'wallet_id' => [
                'nullable',
                'integer',
                Rule::exists('wallets', 'id')
                    ->where('user_id', $this->user()->id)
                    ->whereNull('deleted_at'),
            ],
        ];
    }
}
