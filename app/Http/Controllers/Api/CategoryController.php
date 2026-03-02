<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    //INDEX - Listar categorias do usuário
    //EXPLICAÇÃO:
    //  $request->user() retorna o usuário autenticado (via Sanctum)
    //  ->categories() filtra APENAS as categorias DELE (segurança!)
    //  ->withCount() faz um COUNT(*) no banco e adiciona como atributo
    //  Assim, retorna recurring_bills_count e monthly_bills_count
    //  SEM fazer query extra (performance!)
    public function index(Request $request): JsonResponse
    {
        $categories = $request->user()
            ->categories()
            ->withCount(['recurringBills', 'monthlyBills'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    //STORE - Criar nova categoria
    //EXPLICAÇÃO:
    //  O StoreCategoryRequest já validou tudo ANTES de chegar aqui
    //  Se alguma regra falhou, o Laravel já retornou erro 422
    //  $request->validated() retorna APENAS os campos que passaram na validação
    //  NUNCA use $request->all() — pode ter campos maliciosos!
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $request->user()->categories()->create(
            $request->validated()
        );

        //201 = Created (HTTP status correto para criação)
        return response()->json([
            'message' => 'Categoria criada com sucesso.',
            'data' => $category,
        ], 201);
    }

    //SHOW - Exibir uma categoria específica
    //EXPLICAÇÃO:
    //  findOrFail() busca pelo ID ou retorna 404 automaticamente
    //  Buscamos dentro de ->categories() do usuário logado
    //  Assim, um usuário NUNCA vê as categorias de outro (segurança!)
    public function show(Request $request, int $id): JsonResponse
    {
        $category = $request->user()
            ->categories()
            ->withCount(['recurringBills', 'monthlyBills'])
            ->findOrFail($id);

        return response()->json([
            'data' => $category,
        ]);
    }

    //UPDATE - Atualizar categoria
    //EXPLICAÇÃO:
    //  Mesmo padrão: busca dentro das categorias do usuário
    //  update() com validated() atualiza apenas campos válidos
    //  ->fresh() recarrega o model do banco com os dados atualizados
    public function update(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        $category = $request->user()
            ->categories()
            ->findOrFail($id);

        $category->update($request->validated());

        return response()->json([
            'message' => 'Categoria atualizada com sucesso.',
            'data' => $category->fresh(),
        ]);
    }

    //DESTROY - Deletar categoria (soft delete)
    //EXPLICAÇÃO:
    //  delete() com SoftDeletes preenche deleted_at em vez de remover
    //  O registro continua no banco mas fica "invisível" para queries normais
    //  Retorna 200 em vez de 204 para incluir mensagem de confirmação
    public function destroy(Request $request, int $id): JsonResponse
    {
        $category = $request->user()
            ->categories()
            ->findOrFail($id);

        $category->delete();

        return response()->json([
            'message' => 'Categoria removida com sucesso.',
        ]);
    }
}
