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

        //Busca contas do mês com eager loading
        $monthlyBills = $user->monthlyBills()
            ->with('category')
            ->forMonth($year, $month)
            ->get();

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

        // INCOMES DO MÊS
        $incomes = $user->incomes()
            ->whereYear('expected_date', $year)
            ->whereMonth('expected_date', $month)
            ->get();

        $financialSummary['total_incomes'] = $incomes->sum('amount');
        $financialSummary['total_incomes_received'] = $incomes->where('status', 'received')->sum('amount');
        
        $financialSummary['budget_rules'] = [
            'needs' => $user->budget_needs_percent ?? 50,
            'wants' => $user->budget_wants_percent ?? 30,
            'savings' => $user->budget_savings_percent ?? 20,
        ];
        
        $financialSummary['budget_spent'] = [
            'needs' => $monthlyBills->filter(fn($b) => $b->category?->budget_group === 'needs')->sum('expected_amount'),
            'wants' => $monthlyBills->filter(fn($b) => $b->category?->budget_group === 'wants')->sum('expected_amount'),
            'savings' => $monthlyBills->filter(fn($b) => $b->category?->budget_group === 'savings')->sum('expected_amount'),
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

        return response()->json([
            'financial_summary' => $financialSummary,
            'by_category' => $byCategory,
            'upcoming_bills' => $upcomingBills,
            'overdue_bills' => $overdueBills,
            'upcoming_events' => $upcomingEvents,
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
        $months = $request->integer('months', 6); // padrão: últimos 6 meses

        //Limita entre 1 e 24 meses (segurança para não sobrecarregar)
        $months = max(1, min(24, $months));

        $history = $user->monthlyBills()
            ->select(
                'year',
                'month',
                DB::raw('SUM(expected_amount) as total_expected'),
                DB::raw('SUM(CASE WHEN status = \'paid\' THEN paid_amount ELSE 0 END) as total_paid'),
                DB::raw('COUNT(*) as bills_count'),
                DB::raw('SUM(CASE WHEN status = \'paid\' THEN 1 ELSE 0 END) as paid_count'),
            )
            ->groupBy('year', 'month')
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->limit($months)
            ->get()
            //EXPLICAÇÃO: reverse() inverte a ordem para o gráfico
            //O banco retorna do mais recente ao mais antigo (DESC)
            //O gráfico precisa do mais antigo ao mais recente (cronológico)
            ->reverse()
            ->values();

        return response()->json([
            'data' => $history,
        ]);
    }
}
