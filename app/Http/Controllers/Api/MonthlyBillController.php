<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMonthlyBillRequest;
use App\Http\Requests\UpdateMonthlyBillRequest;
use App\Models\MonthlyBill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        // Self-Healing: transita contas vencidas de pending para overdue automaticamente
        // Usamos exists() para evitar escritas desnecessárias no banco de dados em endpoints GET (P1)
        $hasOverdue = $request->user()->monthlyBills()
            ->where('status', MonthlyBill::STATUS_PENDING)
            ->where('due_date', '<', now()->toDateString())
            ->exists();

        if ($hasOverdue) {
            $request->user()->monthlyBills()
                ->where('status', MonthlyBill::STATUS_PENDING)
                ->where('due_date', '<', now()->toDateString())
                ->update(['status' => MonthlyBill::STATUS_OVERDUE]);
        }

        // Obtém contas reais + virtuais
        $bills = $request->user()->getMonthlyBillsWithVirtual($year, $month);

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

            $firstBill = DB::transaction(function () use ($user, $data, $installmentsCount, $groupId, $startDate) {
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

                return $firstBill;
            });

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
    public function show(Request $request, $id): JsonResponse
    {
        $bill = $this->resolveBill($request, $id, false);

        return response()->json([
            'data' => $bill,
        ]);
    }

    //UPDATE - Atualizar conta mensal
    public function update(UpdateMonthlyBillRequest $request, $id): JsonResponse
    {
        $bill = $this->resolveBill($request, $id, true);

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
                    ->whereIn('status', [MonthlyBill::STATUS_PENDING, MonthlyBill::STATUS_OVERDUE])
                    ->update($updateData);
            }
        }

        return response()->json([
            'message' => 'Conta mensal atualizada com sucesso.',
            'data' => $bill->fresh()->load(['category', 'recurringBill']),
        ]);
    }

    //DESTROY - Deletar conta mensal (soft delete)
    public function destroy(Request $request, $id): JsonResponse
    {
        $bill = $this->resolveBill($request, $id, true);

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
    public function markAsPaid(Request $request, $id): JsonResponse
    {
        $request->validate([
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $bill = $this->resolveBill($request, $id, true);

        $bill->markAsPaid($request->input('paid_amount'));

        return response()->json([
            'message' => 'Conta marcada como paga.',
            'data' => $bill->fresh(),
        ]);
    }

    //MARK AS PENDING - Desfazer Pagamento
    //Uso: PATCH /api/monthly-bills/{id}/pending
    public function markAsPending(Request $request, $id): JsonResponse
    {
        $bill = $this->resolveBill($request, $id, true);

        $bill->markAsPending();

        return response()->json([
            'message' => 'Pagamento desfeito com sucesso.',
            'data' => $bill->fresh(),
        ]);
    }

    //MARK AS OVERDUE - Marcar como atrasada
    //Uso: PATCH /api/monthly-bills/{id}/overdue
    public function markAsOverdue(Request $request, $id): JsonResponse
    {
        $bill = $this->resolveBill($request, $id, true);

        $bill->markAsOverdue();

        return response()->json([
            'message' => 'Conta marcada como atrasada.',
            'data' => $bill->fresh(),
        ]);
    }

    //CANCEL - Cancelar conta
    //Uso: PATCH /api/monthly-bills/{id}/cancel
    public function cancel(Request $request, $id): JsonResponse
    {
        $bill = $this->resolveBill($request, $id, true);

        $bill->cancel();

        return response()->json([
            'message' => 'Conta cancelada.',
            'data' => $bill->fresh(),
        ]);
    }

    /**
     * Resolve um ID que pode ser real (integer) ou virtual (string virtual-RBID-YEAR-MONTH).
     * Se for virtual e $persist for true, a conta é persistida no banco de dados.
     */
    private function resolveBill(Request $request, $id, bool $persist = true)
    {
        if (is_string($id) && str_starts_with($id, 'virtual-')) {
            $parts = explode('-', $id);
            $recurringBillId = (int) $parts[1];
            $year = (int) $parts[2];
            $month = (int) $parts[3];

            $recurringBill = $request->user()->recurringBills()->findOrFail($recurringBillId);

            $dueDay = min($recurringBill->due_day, \Carbon\Carbon::createFromDate($year, $month, 1)->endOfMonth()->day);
            $dueDate = \Carbon\Carbon::createFromDate($year, $month, $dueDay)->toDateString();

            $status = MonthlyBill::STATUS_PENDING;
            if ($dueDate < now()->toDateString()) {
                $status = MonthlyBill::STATUS_OVERDUE;
            }

            $billData = [
                'recurring_bill_id' => $recurringBill->id,
                'category_id' => $recurringBill->category_id,
                'year' => $year,
                'month' => $month,
                'name_snapshot' => $recurringBill->name,
                'expected_amount' => $recurringBill->expected_amount,
                'due_date' => $dueDate,
                'source_uid' => "recurring_{$recurringBill->id}_{$year}_{$month}",
                'status' => $status,
            ];

            if ($persist) {
                return $request->user()->monthlyBills()->create($billData);
            } else {
                $virtualBill = new MonthlyBill($billData);
                $virtualBill->id = $id;
                $virtualBill->incrementing = false;
                
                if ($recurringBill->category_id) {
                    $virtualBill->setRelation('category', $recurringBill->category);
                }
                $virtualBill->setRelation('recurringBill', $recurringBill);
                
                $virtualBill->_virtual = true;
                $virtualBill->_recurring = true;
                return $virtualBill;
            }
        }

        return $request->user()->monthlyBills()->findOrFail((int) $id);
    }
}
