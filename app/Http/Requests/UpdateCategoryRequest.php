<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        //EXPLICAÇÃO: No UPDATE, usamos 'sometimes' em vez de 'required'
        //'sometimes' = "só valide SE o campo foi enviado"
        //Isso permite atualizar APENAS a cor, sem precisar enviar o nome
        //
        //EXPLICAÇÃO DO ignore():
        //  No unique, precisamos IGNORAR o próprio registro
        //  Sem isso, ao atualizar a categoria "Netflix" sem mudar o nome,
        //  o Laravel diria "nome já existe" (porque é ele mesmo!)
        //  ->ignore($this->route('category')) pega o ID da URL

        return [
            'name' => [
                'sometimes',
                'string',
                'max:60',
                Rule::unique('categories', 'name')
                    ->where('user_id', $this->user()->id)
                    ->ignore($this->route('category'))
                    ->whereNull('deleted_at'),
            ],

            'color' => [
                'sometimes',
                'string',
                'max:30',
            ],

            'icon' => ['nullable', 'string', 'max:10'],
            
            'budget_group' => [
                'sometimes',
                'string',
                Rule::in(['needs', 'wants']),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'O nome pode ter no máximo 60 caracteres.',
            'name.unique' => 'Você já tem uma categoria com esse nome.',
            'color.max' => 'Cor inválida (muito longa).',
            'icon.max' => 'O ícone pode ter no máximo 10 caracteres.',
            'budget_group.in' => 'O grupo de orçamento deve ser: needs ou wants.',
        ];
    }
}
