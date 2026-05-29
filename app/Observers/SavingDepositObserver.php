<?php

namespace App\Observers;

use App\Models\SavingDeposit;
use App\Models\Wallet;

class SavingDepositObserver
{
    public function created(SavingDeposit $deposit)
    {
        if ($deposit->wallet_id) {
            // Deduct deposit amount from wallet balance.
            // If amount is positive (deposit), balance goes down.
            // If amount is negative (withdrawal), balance goes up.
            $this->adjustWalletBalance($deposit->wallet_id, -$deposit->amount);
        }
    }

    public function updated(SavingDeposit $deposit)
    {
        $oldWalletId = $deposit->getOriginal('wallet_id');
        $newWalletId = $deposit->wallet_id;

        $oldAmount = $deposit->getOriginal('amount');
        $newAmount = $deposit->amount;

        if ($oldWalletId !== $newWalletId) {
            if ($oldWalletId) {
                // Refund old wallet
                $this->adjustWalletBalance($oldWalletId, $oldAmount);
            }
            if ($newWalletId) {
                // Deduct new wallet
                $this->adjustWalletBalance($newWalletId, -$newAmount);
            }
        } elseif ($oldAmount != $newAmount) {
            // Adjust difference
            $diff = $oldAmount - $newAmount;
            if ($newWalletId) {
                $this->adjustWalletBalance($newWalletId, $diff);
            }
        }
    }

    public function deleted(SavingDeposit $deposit)
    {
        if ($deposit->wallet_id) {
            // Refund the deducted amount
            $this->adjustWalletBalance($deposit->wallet_id, $deposit->amount);
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
