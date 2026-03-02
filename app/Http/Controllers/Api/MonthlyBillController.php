<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMonthlyBillRequest;
use App\Http\Requests\UpdateMonthlyBillRequest;
use App\Models\MonthlyBill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonthlyBillController extends Controller
{
    //INDEX - Listar contas do mês
    //EXPLICAÇÃO:
    //  Esse é o CORAÇÃO do sistema — a tela principal de contas mensais
    //  Recebe year e month via query string: GET /api/monthly-bills?year=2026&month=2
    //  Se não enviar, assume o mês/ano atual
    //  Inclui eager loading de category e recurringBill para evitar N+1
    public function index(Request $request): JsonResponse
    {
        $year = $request->integer('year', now()->year);
        $month = $request->integer('month', now()->month);

        $bills = $request->user()
            ->monthlyBills()
            ->with(['category', 'recurringBill'])
            ->forMonth($year, $month)
            ->orderBy('due_date')
            ->get();

        //EXPLICAÇÃO: Calcula totais para exibir no frontend
        //Usamos o Collection do Laravel para calcular tudo em memória
        //Evita queries extras no banco
        $totals = [
            'expected' => $bills->sum('expected_amount'),
            'paid' => $bills->where('status', MonthlyBill::STATUS_PAID)->sum('paid_amount'),
            'pending' => $bills->where('status', MonthlyBill::STATUS_PENDING)->sum('expected_amount'),
            'overdue' => $bills->where('status', MonthlyBill::STATUS_OVERDUE)->sum('expected_amount'),
            'count' => $bills->count(),
            'paid_count' => $bills->where('status', MonthlyBill::STATUS_PAID)->count(),
            'pending_count' => $bills->where('status', MonthlyBill::STATUS_PENDING)->count(),
        ];

        return response()->json([
            'data' => $bills,
            'totals' => $totals,
            'period' => [
                'year' => $year,
                'month' => $month,
            ],
        ]);
    }

    //STORE - Criar conta mensal avulsa (não gerada por recorrente)
    //EXPLICAÇÃO:
    //  Contas podem ser criadas de 2 formas:
    //  1. Automaticamente pelo sistema (via Job/Cron a partir de RecurringBill)
    //  2. Manualmente pelo usuário (conta avulsa, sem recurring_bill_id)
    //  Aqui tratamos o caso manual
    public function store(StoreMonthlyBillRequest $request): JsonResponse
    {
        $data = $request->validated();

        //EXPLICAÇÃO: source_uid é a chave única que evita duplicatas
        //Para contas manuais, geramos um UID baseado no timestamp
        //Para contas de recorrente, seria "recurring_{id}_{year}_{month}"
        if (empty($data['source_uid'])) {
            $data['source_uid'] = 'manual_' . now()->timestamp . '_' . uniqid();
        }

        $bill = $request->user()->monthlyBills()->create($data);
        $bill->load(['category', 'recurringBill']);

        return response()->json([
            'message' => 'Conta mensal criada com sucesso.',
            'data' => $bill,
        ], 201);
    }

    //SHOW - Exibir uma conta mensal
    public function show(Request $request, int $id): JsonResponse
    {
        $bill = $request->user()
            ->monthlyBills()
            ->with(['category', 'recurringBill'])
            ->findOrFail($id);

        return response()->json([
            'data' => $bill,
        ]);
    }

    //UPDATE - Atualizar conta mensal
    public function update(UpdateMonthlyBillRequest $request, int $id): JsonResponse
    {
        $bill = $request->user()
            ->monthlyBills()
            ->findOrFail($id);

        $bill->update($request->validated());

        return response()->json([
            'message' => 'Conta mensal atualizada com sucesso.',
            'data' => $bill->fresh()->load(['category', 'recurringBill']),
        ]);
    }

    //DESTROY - Deletar conta mensal (soft delete)
    public function destroy(Request $request, int $id): JsonResponse
    {
        $bill = $request->user()
            ->monthlyBills()
            ->findOrFail($id);

        $bill->delete();

        return response()->json([
            'message' => 'Conta mensal removida com sucesso.',
        ]);
    }

    //MARK AS PAID - Marcar como paga
    //EXPLICAÇÃO:
    //  Rota customizada: PATCH /api/monthly-bills/{id}/pay
    //  Aceita paid_amount opcional (se não enviar, usa expected_amount)
    //  Útil para o checklist: "clicou no check = pagou"
    public function markAsPaid(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $bill = $request->user()
            ->monthlyBills()
            ->findOrFail($id);

        $bill->markAsPaid($request->input('paid_amount'));

        return response()->json([
            'message' => 'Conta marcada como paga.',
            'data' => $bill->fresh(),
        ]);
    }

    //MARK AS OVERDUE - Marcar como atrasada
    //Uso: PATCH /api/monthly-bills/{id}/overdue
    public function markAsOverdue(Request $request, int $id): JsonResponse
    {
        $bill = $request->user()
            ->monthlyBills()
            ->findOrFail($id);

        $bill->markAsOverdue();

        return response()->json([
            'message' => 'Conta marcada como atrasada.',
            'data' => $bill->fresh(),
        ]);
    }

    //CANCEL - Cancelar conta
    //Uso: PATCH /api/monthly-bills/{id}/cancel
    public function cancel(Request $request, int $id): JsonResponse
    {
        $bill = $request->user()
            ->monthlyBills()
            ->findOrFail($id);

        $bill->cancel();

        return response()->json([
            'message' => 'Conta cancelada.',
            'data' => $bill->fresh(),
        ]);
    }
}
