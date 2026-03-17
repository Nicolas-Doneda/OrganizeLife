<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWalletRequest;
use App\Http\Requests\UpdateWalletRequest;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $wallets = $request->user()
            ->wallets()
            ->withCount([
                'monthlyBills' => function ($query) {
                    $query->where('status', '!=', 'canceled');
                },
                'incomes'
            ])
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $wallets,
        ]);
    }

    public function store(StoreWalletRequest $request): JsonResponse
    {
        $wallet = $request->user()->wallets()->create(
            $request->validated()
        );

        return response()->json([
            'message' => 'Carteira criada com sucesso.',
            'data' => $wallet,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $wallet = $request->user()
            ->wallets()
            ->withCount([
                'monthlyBills' => function ($query) {
                    $query->where('status', '!=', 'canceled');
                },
                'incomes'
            ])
            ->findOrFail($id);

        return response()->json([
            'data' => $wallet,
        ]);
    }

    public function update(UpdateWalletRequest $request, int $id): JsonResponse
    {
        $wallet = $request->user()
            ->wallets()
            ->findOrFail($id);

        $wallet->update($request->validated());

        return response()->json([
            'message' => 'Carteira atualizada com sucesso.',
            'data' => $wallet->fresh(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $wallet = $request->user()
            ->wallets()
            ->findOrFail($id);

        $wallet->delete();

        return response()->json([
            'message' => 'Carteira removida com sucesso.',
        ]);
    }
}
