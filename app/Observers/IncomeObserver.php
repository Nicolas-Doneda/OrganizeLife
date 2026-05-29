<?php

namespace App\Observers;

use App\Models\Income;
use App\Models\Wallet;

class IncomeObserver
{
    public function created(Income $income)
    {
        if ($income->status === 'received' && $income->wallet_id) {
            $this->adjustWalletBalance($income->wallet_id, $income->amount);
        }
    }

    public function updated(Income $income)
    {
        $wasReceived = $income->getOriginal('status') === 'received';
        $isReceived = $income->status === 'received';

        $oldWalletId = $income->getOriginal('wallet_id');
        $newWalletId = $income->wallet_id;

        $oldAmount = $income->getOriginal('amount');
        $newAmount = $income->amount;

        if ($wasReceived && !$isReceived) {
            // Un-received: deduct old wallet
            if ($oldWalletId) {
                $this->adjustWalletBalance($oldWalletId, -$oldAmount);
            }
        } elseif (!$wasReceived && $isReceived) {
            // Received: add to new wallet
            if ($newWalletId) {
                $this->adjustWalletBalance($newWalletId, $newAmount);
            }
        } elseif ($isReceived && $wasReceived) {
            // Still received, check if wallet or amount changed
            if ($oldWalletId !== $newWalletId) {
                if ($oldWalletId) {
                    $this->adjustWalletBalance($oldWalletId, -$oldAmount);
                }
                if ($newWalletId) {
                    $this->adjustWalletBalance($newWalletId, $newAmount);
                }
            } elseif ($oldAmount != $newAmount) {
                // Adjust difference
                $diff = $newAmount - $oldAmount;
                if ($newWalletId) {
                    $this->adjustWalletBalance($newWalletId, $diff);
                }
            }
        }
    }

    public function deleted(Income $income)
    {
        if ($income->status === 'received' && $income->wallet_id) {
            $this->adjustWalletBalance($income->wallet_id, -$income->amount);
        }
    }

    public function restored(Income $income)
    {
        if ($income->status === 'received' && $income->wallet_id) {
            $this->adjustWalletBalance($income->wallet_id, $income->amount);
        }
    }

    private function adjustWalletBalance(int $walletId, $amount)
    {
        $wallet = Wallet::find($walletId);
        if ($wallet) {
            $wallet->increment('balance', $amount);
        }
    }
}
