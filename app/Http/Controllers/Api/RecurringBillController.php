<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecurringBillRequest;
use App\Http\Requests\UpdateRecurringBillRequest;
use App\Models\RecurringBill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecurringBillController extends Controller
{
    //INDEX - Listar contas recorrentes
    //EXPLICAÇÃO:
    //  with('category') = Eager Loading
    //  SEM isso: cada conta faria 1 query para buscar sua categoria (N+1 Problem)
    //  COM isso: o Laravel faz 1 query para contas + 1 query para categorias (2 total!)
    //  Exemplo: 50 contas = 51 queries SEM eager loading vs 2 queries COM
    //  Isso é CRÍTICO para performance em produção!
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()
            ->recurringBills()
            ->with('category')
            ->withCount('monthlyBills');

        //Filtro por status ativo/inativo (opcional via query string)
        //Uso: GET /api/recurring-bills?active=1
        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }

        $bills = $query->orderBy('name')->get();

        return response()->json([
            'data' => $bills,
        ]);
    }

    //STORE - Criar conta recorrente
    public function store(StoreRecurringBillRequest $request): JsonResponse
    {
        $bill = $request->user()->recurringBills()->create(
            $request->validated()
        );

        //Carrega a relação de categoria para retornar junto
        $bill->load('category');

        return response()->json([
            'message' => 'Conta recorrente criada com sucesso.',
            'data' => $bill,
        ], 201);
    }

    //SHOW - Exibir uma conta recorrente
    //EXPLICAÇÃO:
    //  withCount(['monthlyBills as paid_count' => ...])
    //  Isso cria um COUNT com condição WHERE
    //  Resultado: $bill->paid_count, $bill->pending_count
    //  Tudo em UMA query, sem carregar os registros
    public function show(Request $request, int $id): JsonResponse
    {
        $bill = $request->user()
            ->recurringBills()
            ->with('category')
            ->withCount([
                'monthlyBills',
                'monthlyBills as paid_count' => function ($query) {
                    $query->where('status', 'paid');
                },
                'monthlyBills as pending_count' => function ($query) {
                    $query->where('status', 'pending');
                },
            ])
            ->findOrFail($id);

        return response()->json([
            'data' => $bill,
        ]);
    }

    //UPDATE - Atualizar conta recorrente
    public function update(UpdateRecurringBillRequest $request, int $id): JsonResponse
    {
        $bill = $request->user()
            ->recurringBills()
            ->findOrFail($id);

        $bill->update($request->validated());

        return response()->json([
            'message' => 'Conta recorrente atualizada com sucesso.',
            'data' => $bill->fresh()->load('category'),
        ]);
    }

    //DESTROY - Deletar conta recorrente (soft delete)
    public function destroy(Request $request, int $id): JsonResponse
    {
        $bill = $request->user()
            ->recurringBills()
            ->findOrFail($id);

        $bill->delete();

        return response()->json([
            'message' => 'Conta recorrente removida com sucesso.',
        ]);
    }

    //ACTIVATE - Reativar uma conta desativada
    //EXPLICAÇÃO: Rota customizada, não faz parte do Resource padrão
    //Uso: PATCH /api/recurring-bills/{id}/activate
    public function activate(Request $request, int $id): JsonResponse
    {
        $bill = $request->user()
            ->recurringBills()
            ->findOrFail($id);

        $bill->activate();

        return response()->json([
            'message' => 'Conta recorrente ativada com sucesso.',
            'data' => $bill->fresh(),
        ]);
    }

    //DEACTIVATE - Desativar uma conta sem deletar
    //EXPLICAÇÃO: Diferente de deletar! A conta continua no sistema
    //Apenas para de gerar MonthlyBills novos
    //Uso: PATCH /api/recurring-bills/{id}/deactivate
    public function deactivate(Request $request, int $id): JsonResponse
    {
        $bill = $request->user()
            ->recurringBills()
            ->findOrFail($id);

        $bill->deactivate();

        return response()->json([
            'message' => 'Conta recorrente desativada com sucesso.',
            'data' => $bill->fresh(),
        ]);
    }
}
