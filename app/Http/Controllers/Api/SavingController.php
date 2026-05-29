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
            'wallet_id' => [
                'nullable',
                'integer',
                \Illuminate\Validation\Rule::exists('wallets', 'id')
                    ->where('user_id', $request->user()->id)
                    ->whereNull('deleted_at'),
            ],
        ]);

        if (empty($validated['current_amount'])) {
            $validated['current_amount'] = 0;
        }

        // Remove wallet_id from validated fields for Saving model
        $savingData = $validated;
        unset($savingData['wallet_id']);

        $saving = $request->user()->savings()->create($savingData);

        // Se criou a caixinha já com saldo inicial, registra como depósito
        if ($saving->current_amount > 0) {
            $saving->deposits()->create([
                'user_id' => $request->user()->id,
                'wallet_id' => $validated['wallet_id'] ?? null,
                'amount' => $saving->current_amount,
                'deposit_date' => now()->toDateString(),
            ]);
        }

        return response()->json([
            'message' => 'Economia criada com sucesso.',
            'data' => $saving
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $saving = $request->user()->savings()->findOrFail($id);
        return response()->json(['data' => $saving]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $saving = $request->user()->savings()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'target_amount' => 'nullable|numeric|min:0',
            'current_amount' => 'sometimes|required|numeric|min:0',
            'color' => 'nullable|string',
            'icon' => 'nullable|string',
            'wallet_id' => [
                'nullable',
                'integer',
                \Illuminate\Validation\Rule::exists('wallets', 'id')
                    ->where('user_id', $request->user()->id)
                    ->whereNull('deleted_at'),
            ],
        ]);

        // Captura o saldo antigo antes de atualizar
        $oldAmount = (float) $saving->current_amount;
        
        $savingData = $validated;
        unset($savingData['wallet_id']);
        
        $saving->update($savingData);
        $newAmount = (float) $saving->current_amount;

        // Se o saldo mudou, registra a diferença como depósito/retirada (P3)
        $diff = $newAmount - $oldAmount;
        if ($diff != 0) {
            $saving->deposits()->create([
                'user_id' => $request->user()->id,
                'wallet_id' => $validated['wallet_id'] ?? null,
                'amount' => $diff,
                'deposit_date' => now()->toDateString(),
            ]);
        }

        return response()->json([
            'message' => 'Economia atualizada com sucesso.',
            'data' => $saving
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $saving = $request->user()->savings()->findOrFail($id);
        // Remove os depósitos antes do soft delete da caixinha
        $saving->deposits()->delete();
        $saving->delete();
        return response()->json(['message' => 'Economia removida com sucesso.']);
    }

    public function addFunds(Request $request, int $id): JsonResponse
    {
        $saving = $request->user()->savings()->findOrFail($id);

        $request->validate([
            'amount' => 'required|numeric',
            'wallet_id' => [
                'nullable',
                'integer',
                \Illuminate\Validation\Rule::exists('wallets', 'id')
                    ->where('user_id', $request->user()->id)
                    ->whereNull('deleted_at'),
            ],
        ]);
        $saving->current_amount += $request->amount;
        $saving->save();

        // Salvar a evidência (Transaction) do depósito para o Orçamento
        $saving->deposits()->create([
            'user_id' => $request->user()->id,
            'wallet_id' => $request->input('wallet_id'),
            'amount' => $request->amount,
            'deposit_date' => now()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Fundos adicionados com sucesso.',
            'data' => $saving
        ]);
    }

    public function deposits(Request $request, int $id): JsonResponse
    {
        $saving = $request->user()->savings()->findOrFail($id);

        $deposits = $saving->deposits()
            ->orderByDesc('deposit_date')
            ->get();

        return response()->json(['data' => $deposits]);
    }
}
