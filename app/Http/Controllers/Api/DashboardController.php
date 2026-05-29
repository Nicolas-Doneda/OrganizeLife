<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MonthlyBill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    //SUMMARY - Resumo do mês atual (para o dashboard principal)
    //EXPLICAÇÃO:
    //  Retorna todos os dados que o dashboard precisa em UMA chamada
    //  Isso evita que o frontend faça 5-6 requests separados
    //  Performance: menos requests = carregamento mais rápido
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $year = $request->integer('year', now()->year);
        $month = $request->integer('month', now()->month);

        // Self-Healing: transita contas vencidas de pending para overdue automaticamente
        // Usamos exists() para evitar escritas desnecessárias no banco de dados em endpoints GET (P1)
        $hasOverdue = $user->monthlyBills()
            ->where('status', MonthlyBill::STATUS_PENDING)
            ->where('due_date', '<', now()->toDateString())
            ->exists();

        if ($hasOverdue) {
            $user->monthlyBills()
                ->where('status', MonthlyBill::STATUS_PENDING)
                ->where('due_date', '<', now()->toDateString())
                ->update(['status' => MonthlyBill::STATUS_OVERDUE]);
        }

        //Busca contas do mês com eager loading e projeções virtuais de recorrentes
        $monthlyBills = $user->getMonthlyBillsWithVirtual($year, $month);

        //RESUMO FINANCEIRO DO MÊS
        //EXPLICAÇÃO: Todos os cálculos são feitos na Collection (em memória)
        //Como já carregamos os dados, não precisa ir ao banco de novo
        $financialSummary = [
            'total_expected' => $monthlyBills->sum('expected_amount'),
            'total_paid' => $monthlyBills->where('status', MonthlyBill::STATUS_PAID)->sum('paid_amount'),
            'total_pending' => $monthlyBills->where('status', MonthlyBill::STATUS_PENDING)->sum('expected_amount'),
            'total_overdue' => $monthlyBills->where('status', MonthlyBill::STATUS_OVERDUE)->sum('expected_amount'),
            'bills_count' => $monthlyBills->count(),
            'bills_paid' => $monthlyBills->where('status', MonthlyBill::STATUS_PAID)->count(),
            'bills_pending' => $monthlyBills->where('status', MonthlyBill::STATUS_PENDING)->count(),
            'bills_overdue' => $monthlyBills->where('status', MonthlyBill::STATUS_OVERDUE)->count(),
        ];

        // INCOMES DO MÊS (injected with virtual ones)
        $incomes = $user->getIncomesWithVirtual($year, $month);

        $financialSummary['total_incomes'] = $incomes->sum('amount');
        $financialSummary['total_incomes_received'] = $incomes->where('status', 'received')->sum('amount');
        
        $financialSummary['budget_rules'] = [
            'needs' => $user->budget_needs_percent ?? 50,
            'wants' => $user->budget_wants_percent ?? 30,
            'savings' => $user->budget_savings_percent ?? 20,
        ];
        
        $activeSavingIds = $user->savings()->pluck('id');

        $startDate = \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
        $endDate = \Carbon\Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();

        $savingsDepositedThisMonth = $user->savingDeposits()
            ->whereIn('saving_id', $activeSavingIds)
            ->whereBetween('deposit_date', [$startDate, $endDate])
            ->sum('amount');

        $financialSummary['budget_spent'] = [
            'needs' => $monthlyBills->filter(fn($b) => $b->category?->budget_group === 'needs')->sum('expected_amount'),
            'wants' => $monthlyBills->filter(fn($b) => $b->category?->budget_group === 'wants')->sum('expected_amount'),
            'savings' => (float) $savingsDepositedThisMonth,
        ];

        //GASTOS POR CATEGORIA (para gráfico de pizza/rosca)
        //EXPLICAÇÃO:
        //  groupBy('category_id') agrupa as contas por categoria
        //  map() transforma cada grupo em um resumo
        //  values() reindexado de 0 a N (necessário para JSON)
        //  filter() remove contas sem categoria
        $byCategory = $monthlyBills
            ->groupBy('category_id')
            ->map(function ($bills, $categoryId) {
                $category = $bills->first()->category;

                return [
                    'category_id' => $categoryId,
                    'category_name' => $category?->name ?? 'Sem categoria',
                    'category_color' => $category?->color ?? 'gray',
                    'total' => $bills->sum('expected_amount'),
                    'paid' => $bills->where('status', MonthlyBill::STATUS_PAID)->sum('paid_amount'),
                    'count' => $bills->count(),
                ];
            })
            ->values();

        //PRÓXIMAS CONTAS A VENCER (top 5)
        $upcomingBills = $monthlyBills
            ->where('status', MonthlyBill::STATUS_PENDING)
            ->sortBy('due_date')
            ->take(5)
            ->values();

        //CONTAS ATRASADAS
        $overdueBills = $monthlyBills
            ->where('status', MonthlyBill::STATUS_OVERDUE)
            ->sortBy('due_date')
            ->values();

        //PRÓXIMOS EVENTOS (para o widget lateral)
        $upcomingEvents = $user->events()
            ->upcoming()
            ->limit(5)
            ->get();

        //ECONOMIAS (SAVINGS)
        $savings = $user->savings()->get();

        return response()->json([
            'financial_summary' => $financialSummary,
            'by_category' => $byCategory,
            'upcoming_bills' => $upcomingBills,
            'overdue_bills' => $overdueBills,
            'upcoming_events' => $upcomingEvents,
            'savings' => $savings,
            'period' => [
                'year' => $year,
                'month' => $month,
            ],
        ]);
    }

    //HISTORY - Histórico mensal (para gráfico de barras/linhas)
    //EXPLICAÇÃO:
    //  Retorna o total gasto por mês nos últimos N meses
    //  O frontend usa isso para desenhar o gráfico de evolução
    //  Exemplo retorno: [{month: "Jan/2026", total: 3500}, {month: "Fev/2026", total: 4200}]
    //
    //  DB::raw() = SQL direto (quando Eloquent não atende)
    //  SUM(paid_amount) = soma apenas do que foi REALMENTE pago
    //  GROUP BY year, month = agrupa por período
    //  ORDER BY year, month = ordena cronologicamente
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        $startYear = $request->integer('year', now()->year);
        $startMonth = $request->integer('month', now()->month);
        $months = $request->integer('months', 6); // padrão: próximos 6 meses

        //Limita entre 1 e 24 meses (segurança para não sobrecarregar)
        $months = max(1, min(24, $months));

        $data = [];
        $currentDate = \Carbon\Carbon::createFromDate($startYear, $startMonth, 1);

        for ($i = 0; $i < $months; $i++) {
            $y = $currentDate->year;
            $m = $currentDate->month;

            // Busca as contas daquele mês, incluindo as recorrentes virtuais
            $monthlyBills = $user->getMonthlyBillsWithVirtual($y, $m);

            $totalExpected = $monthlyBills->sum('expected_amount');
            $totalPaid = $monthlyBills->where('status', MonthlyBill::STATUS_PAID)->sum('paid_amount');
            $billsCount = $monthlyBills->count();
            $paidCount = $monthlyBills->where('status', MonthlyBill::STATUS_PAID)->count();

            $data[] = [
                'year' => $y,
                'month' => $m,
                'total_expected' => (float)$totalExpected,
                'total_paid' => (float)$totalPaid,
                'bills_count' => $billsCount,
                'paid_count' => $paidCount,
            ];

            // Avança para o próximo mês
            $currentDate->addMonth();
        }

        return response()->json([
            'data' => $data,
        ]);
    }
}
