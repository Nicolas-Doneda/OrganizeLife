<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    //EXPLICAÇÃO: authorize() define QUEM pode usar esse request
    //Retornando true = qualquer usuário autenticado pode criar categorias
    //Mais tarde, quando tivermos middleware de auth, isso já estará protegido
    public function authorize(): bool
    {
        return true;
    }

    //EXPLICAÇÃO: rules() define as regras de validação
    //Se alguma regra falhar, Laravel retorna erro 422 automaticamente
    //O request NEM CHEGA no controller se a validação falhar (segurança!)
    public function rules(): array
    {
        return [
            //name: obrigatório, texto, máx 60 chars
            //unique composto: não pode ter 2 categorias com mesmo nome PRO MESMO USUÁRIO
            //EXPLICAÇÃO DO Rule::unique:
            //  ->where() adiciona condição extra: "onde user_id = meu id"
            //  Assim, 2 usuários diferentes PODEM ter "Alimentação"
            //  Mas o MESMO usuário NÃO pode criar "Alimentação" 2 vezes
            'name' => [
                'required',
                'string',
                'max:60',
                Rule::unique('categories', 'name')
                    ->where('user_id', $this->user()->id)
                    ->whereNull('deleted_at'),
            ],

            //color: opcional, deve ser uma das cores permitidas
            //EXPLICAÇÃO: Limitamos as opções para manter consistência visual no frontend
            'color' => [
                'sometimes',
                'string',
                Rule::in([
                    'gray', 'red', 'orange', 'yellow', 'green',
                    'teal', 'blue', 'indigo', 'purple', 'pink',
                ]),
            ],

            //icon: opcional, máx 10 chars (emoji ou código de ícone)
            'icon' => ['nullable', 'string', 'max:10'],
        ];
    }

    //EXPLICAÇÃO: Mensagens de erro em português
    //Padrão do Laravel é inglês, então customizamos aqui
    public function messages(): array
    {
        return [
            'name.required' => 'O nome da categoria é obrigatório.',
            'name.max' => 'O nome pode ter no máximo 60 caracteres.',
            'name.unique' => 'Você já tem uma categoria com esse nome.',
            'color.in' => 'Cor inválida. Use: gray, red, orange, yellow, green, teal, blue, indigo, purple ou pink.',
            'icon.max' => 'O ícone pode ter no máximo 10 caracteres.',
        ];
    }
}
