<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreIncomeRequest;
use App\Http\Requests\UpdateIncomeRequest;
use App\Models\Income;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncomeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $year = $request->integer('year', now()->year);
        $month = $request->integer('month', now()->month);

        $incomes = $request->user()
            ->incomes()
            ->where(function ($query) use ($year, $month) {
                // Fixed incomes show up every month logically, 
                // but since Phase 1 just records them, let's filter by expected_date month/year.
                $query->whereYear('expected_date', $year)
                      ->whereMonth('expected_date', $month);
            })
            ->orderBy('expected_date')
            ->get();

        return response()->json([
            'data' => $incomes,
        ]);
    }

    public function store(StoreIncomeRequest $request): JsonResponse
    {
        $income = $request->user()->incomes()->create($request->validated());

        return response()->json([
            'message' => 'Renda adicionada com sucesso.',
            'data' => $income,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $income = $request->user()->incomes()->findOrFail($id);

        return response()->json([
            'data' => $income,
        ]);
    }

    public function update(UpdateIncomeRequest $request, int $id): JsonResponse
    {
        $income = $request->user()->incomes()->findOrFail($id);
        $income->update($request->validated());

        return response()->json([
            'message' => 'Renda atualizada com sucesso.',
            'data' => $income->fresh(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $income = $request->user()->incomes()->findOrFail($id);
        $income->delete();

        return response()->json([
            'message' => 'Renda removida com sucesso.',
        ]);
    }

    public function receive(Request $request, int $id): JsonResponse
    {
        $income = $request->user()->incomes()->findOrFail($id);
        
        $income->update([
            'status' => 'received'
        ]);

        return response()->json([
            'message' => 'Renda marcada como recebida.',
            'data' => $income->fresh(),
        ]);
    }
}
