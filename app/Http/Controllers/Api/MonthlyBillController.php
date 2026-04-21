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
        $isInstallment = $request->boolean('is_installment', false);
        $user = $request->user();

        if ($isInstallment) {
            $installmentsCount = $data['installments_count'];
            $groupId = 'inst_' . uniqid() . '_' . now()->timestamp;
            $startDate = \Carbon\Carbon::parse($data['due_date']);
            
            $billsToCreate = [];
            $firstBill = null;

            for ($i = 1; $i <= $installmentsCount; $i++) {
                // Clona a data base e adiciona meses sem estourar dias (ex: 31 Jan -> 28 Fev)
                $currentDate = $startDate->copy()->addMonthsNoOverflow($i - 1);
                
                $billData = $data; // Copia os dados validados (nome, valor, notas, wallet_id, etc)
                
                // Sobrescreve dados específicos da parcela
                $billData['year'] = $currentDate->year;
                $billData['month'] = $currentDate->month;
                $billData['due_date'] = $currentDate->format('Y-m-d');
                $billData['source_uid'] = "installment_{$groupId}_{$i}";
                
                $billData['installment_group_id'] = $groupId;
                $billData['installment_index'] = $i;
                $billData['installment_total'] = $installmentsCount;

                // Regra de Overdue (só se a data já passou e não é hoje)
                if ($currentDate->isPast() && !$currentDate->isToday()) {
                    $billData['status'] = MonthlyBill::STATUS_OVERDUE;
                } else {
                    $billData['status'] = MonthlyBill::STATUS_PENDING;
                }
                
                // Remove campos não permitidos no DB
                unset($billData['is_installment'], $billData['installments_count']);

                $createdBill = $user->monthlyBills()->create($billData);
                
                if ($i === 1) {
                    $firstBill = $createdBill;
                }
            }

            $firstBill->load(['category', 'recurringBill']);
            
            return response()->json([
                'message' => "{$installmentsCount} parcelas criadas com sucesso.",
                'data' => $firstBill,
            ], 201);
            
        } else {
            // Lógica antiga para criar conta avulsa normal
            if (empty($data['source_uid'])) {
                $data['source_uid'] = 'manual_' . now()->timestamp . '_' . uniqid();
            }

            if (isset($data['due_date'])) {
                $dueDate = \Carbon\Carbon::parse($data['due_date']);
                if ($dueDate->isPast() && !$dueDate->isToday() && (!isset($data['status']) || $data['status'] === MonthlyBill::STATUS_PENDING)) {
                    $data['status'] = MonthlyBill::STATUS_OVERDUE;
                }
            }
            
            // Corrige se cair algum campo fantasma do frontend
            unset($data['is_installment'], $data['installments_count']);

            $bill = $user->monthlyBills()->create($data);
            $bill->load(['category', 'recurringBill']);

            return response()->json([
                'message' => 'Conta mensal criada com sucesso.',
                'data' => $bill,
            ], 201);
        }
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

        $validated = $request->validated();
        $updateAll = $request->boolean('update_all_installments', false);
        
        // Verifica se a data de vencimento foi alterada para o passado (para marcar como overdue) ou volta para pendente se for futuro
        if (isset($validated['due_date']) && in_array($bill->status, [MonthlyBill::STATUS_PENDING, MonthlyBill::STATUS_OVERDUE])) {
            $dueDate = \Carbon\Carbon::parse($validated['due_date']);
            if ($dueDate->isPast() && !$dueDate->isToday()) {
                $validated['status'] = MonthlyBill::STATUS_OVERDUE;
            } else {
                $validated['status'] = MonthlyBill::STATUS_PENDING;
            }
        }

        $bill->update($validated);
        
        // Update recurring bill due_day if present
        if ($bill->recurring_bill_id && isset($validated['due_date'])) {
            $dueDay = \Carbon\Carbon::parse($validated['due_date'])->day;
            $bill->recurringBill()->update([
                'due_day' => $dueDay
            ]);
        }

        // Se pediu para atualizar as próximas parcelas
        if ($updateAll && $bill->isInstallment()) {
            $updateData = [];
            
            // Só propaga campos seguros que fazem sentido serem iguais (categoria, carteira, notas)
            // NUNCA propaga: status, data de vencimento, valor pago, id
            if (array_key_exists('category_id', $validated)) $updateData['category_id'] = $validated['category_id'];
            if (array_key_exists('wallet_id', $validated)) $updateData['wallet_id'] = $validated['wallet_id'];
            if (array_key_exists('expected_amount', $validated)) $updateData['expected_amount'] = $validated['expected_amount'];
            if (array_key_exists('notes', $validated)) $updateData['notes'] = $validated['notes'];
            if (array_key_exists('name_snapshot', $validated)) $updateData['name_snapshot'] = $validated['name_snapshot'];

            if (!empty($updateData)) {
                $request->user()->monthlyBills()
                    ->where('installment_group_id', $bill->installment_group_id)
                    ->where('installment_index', '>', $bill->installment_index)
                    ->update($updateData);
            }
        }

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

        $deleteAll = $request->boolean('delete_all_installments', false);
        $deleteRecurring = $request->boolean('delete_recurring', false);

        // Se pediu para excluir a assinatura junto
        if ($deleteRecurring && $bill->recurring_bill_id) {
            $bill->recurringBill()->delete();
        }

        if ($deleteAll && $bill->isInstallment()) {
            // Deleta esta e todas as parcelas futuras do mesmo grupo
            $request->user()->monthlyBills()
                ->where('installment_group_id', $bill->installment_group_id)
                ->where('installment_index', '>=', $bill->installment_index)
                ->delete();

            return response()->json([
                'message' => 'Parcelas removidas com sucesso.',
            ]);
        }

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

    //MARK AS PENDING - Desfazer Pagamento
    //Uso: PATCH /api/monthly-bills/{id}/pending
    public function markAsPending(Request $request, int $id): JsonResponse
    {
        $bill = $request->user()
            ->monthlyBills()
            ->findOrFail($id);

        $bill->markAsPending();

        return response()->json([
            'message' => 'Pagamento desfeito com sucesso.',
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
