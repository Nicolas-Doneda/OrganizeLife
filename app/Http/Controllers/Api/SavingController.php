<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Saving;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $savings = $request->user()->savings()->orderBy('created_at', 'desc')->get();
        return response()->json(['data' => $savings]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'nullable|numeric|min:0',
            'current_amount' => 'nullable|numeric|min:0',
            'color' => 'nullable|string',
            'icon' => 'nullable|string',
        ]);

        if (empty($validated['current_amount'])) {
            $validated['current_amount'] = 0;
        }

        $saving = $request->user()->savings()->create($validated);

        // Se criou a caixinha já com saldo inicial, registra como depósito
        if ($saving->current_amount > 0) {
            $saving->deposits()->create([
                'user_id' => $request->user()->id,
                'amount' => $saving->current_amount,
                'deposit_date' => now()->toDateString(),
            ]);
        }

        return response()->json([
            'message' => 'Economia criada com sucesso.',
            'data' => $saving
        ], 201);
    }

    public function show(Request $request, Saving $saving): JsonResponse
    {
        if ($saving->user_id !== $request->user()->id) abort(403);
        return response()->json(['data' => $saving]);
    }

    public function update(Request $request, Saving $saving): JsonResponse
    {
        if ($saving->user_id !== $request->user()->id) abort(403);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'target_amount' => 'nullable|numeric|min:0',
            'current_amount' => 'sometimes|required|numeric|min:0',
            'color' => 'nullable|string',
            'icon' => 'nullable|string',
        ]);

        // Captura o saldo antigo antes de atualizar
        $oldAmount = (float) $saving->current_amount;
        $saving->update($validated);
        $newAmount = (float) $saving->current_amount;

        // Se o saldo aumentou, registra a diferença como depósito
        $diff = $newAmount - $oldAmount;
        if ($diff > 0) {
            $saving->deposits()->create([
                'user_id' => $request->user()->id,
                'amount' => $diff,
                'deposit_date' => now()->toDateString(),
            ]);
        }

        return response()->json([
            'message' => 'Economia atualizada com sucesso.',
            'data' => $saving
        ]);
    }

    public function destroy(Request $request, Saving $saving): JsonResponse
    {
        if ($saving->user_id !== $request->user()->id) abort(403);
        // Remove os depósitos antes do soft delete da caixinha
        $saving->deposits()->delete();
        $saving->delete();
        return response()->json(['message' => 'Economia removida com sucesso.']);
    }

    public function addFunds(Request $request, Saving $saving): JsonResponse
    {
        if ($saving->user_id !== $request->user()->id) abort(403);

        $request->validate(['amount' => 'required|numeric|min:0.01']);
        $saving->current_amount += $request->amount;
        $saving->save();

        // Salvar a evidência (Transaction) do depósito para o Orçamento
        $saving->deposits()->create([
            'user_id' => $request->user()->id,
            'amount' => $request->amount,
            'deposit_date' => now()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Fundos adicionados com sucesso.',
            'data' => $saving
        ]);
    }

    public function deposits(Request $request, Saving $saving): JsonResponse
    {
        if ($saving->user_id !== $request->user()->id) abort(403);

        $deposits = $saving->deposits()
            ->orderByDesc('deposit_date')
            ->get();

        return response()->json(['data' => $deposits]);
    }
}
