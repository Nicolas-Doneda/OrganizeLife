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

        // Fetch incomes with virtual predictions using the helper on User (P_ADD3: eager loads wallet)
        $incomes = $request->user()->getIncomesWithVirtual($year, $month);

        return response()->json([
            'data' => $incomes,
        ]);
    }

    public function store(StoreIncomeRequest $request): JsonResponse
    {
        $data = $request->validated();
        $isRecurring = $request->boolean('is_recurring');
        $user = $request->user();

        if ($isRecurring) {
            $expectedDate = \Carbon\Carbon::parse($data['expected_date'] ?? now());
            $receiveDay = $expectedDate->day;

            // Create template
            $recurring = $user->recurringIncomes()->create([
                'name' => $data['name'],
                'amount' => $data['amount'],
                'receive_day' => $receiveDay,
                'wallet_id' => $data['wallet_id'] ?? null,
                'active' => true,
            ]);

            // Create instance for the current month
            $income = $user->incomes()->create([
                'recurring_income_id' => $recurring->id,
                'wallet_id' => $data['wallet_id'] ?? null,
                'name' => $data['name'],
                'amount' => $data['amount'],
                'expected_date' => $expectedDate->toDateString(),
                'status' => $data['status'] ?? 'pending',
            ]);
        } else {
            // Remove is_recurring field before creating
            unset($data['is_recurring']);
            $income = $user->incomes()->create($data);
        }

        return response()->json([
            'message' => 'Renda adicionada com sucesso.',
            'data' => $income->load('wallet'),
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $year = $request->integer('year', now()->year);
        $month = $request->integer('month', now()->month);
        $income = $this->resolveIncome($request, $id, $year, $month);

        return response()->json([
            'data' => $income->load('wallet'),
        ]);
    }

    public function update(UpdateIncomeRequest $request, string $id): JsonResponse
    {
        $year = $request->integer('year', now()->year);
        $month = $request->integer('month', now()->month);
        
        $income = $this->resolveIncome($request, $id, $year, $month);
        $income->update($request->validated());

        return response()->json([
            'message' => 'Renda atualizada com sucesso.',
            'data' => $income->fresh()->load('wallet'),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        if (str_starts_with($id, 'virtual-')) {
            // If virtual, do nothing and return success
            return response()->json([
                'message' => 'Renda removida com sucesso.',
            ]);
        }

        $income = $request->user()->incomes()->findOrFail((int) $id);
        $income->delete();

        return response()->json([
            'message' => 'Renda removida com sucesso.',
        ]);
    }

    public function receive(Request $request, string $id): JsonResponse
    {
        $year = $request->integer('year', now()->year);
        $month = $request->integer('month', now()->month);
        
        $income = $this->resolveIncome($request, $id, $year, $month);
        $income->update([
            'status' => 'received'
        ]);

        return response()->json([
            'message' => 'Renda marcada como recebida.',
            'data' => $income->fresh()->load('wallet'),
        ]);
    }

    /**
     * Resolves virtual or real income ID.
     */
    private function resolveIncome(Request $request, $id, int $year, int $month)
    {
        if (is_string($id) && str_starts_with($id, 'virtual-')) {
            $parts = explode('-', $id);
            $recurringIncomeId = (int) $parts[1];
            $targetYear = (int) $parts[2];
            $targetMonth = (int) $parts[3];

            $recurring = $request->user()->recurringIncomes()->findOrFail($recurringIncomeId);

            $receiveDay = min($recurring->receive_day, \Carbon\Carbon::createFromDate($targetYear, $targetMonth, 1)->endOfMonth()->day);
            $expectedDate = \Carbon\Carbon::createFromDate($targetYear, $targetMonth, $receiveDay)->toDateString();

            return $request->user()->incomes()->create([
                'recurring_income_id' => $recurring->id,
                'wallet_id' => $recurring->wallet_id,
                'name' => $recurring->name,
                'amount' => $recurring->amount,
                'expected_date' => $expectedDate,
                'status' => 'pending',
            ]);
        }

        return $request->user()->incomes()->findOrFail((int) $id);
    }
}
