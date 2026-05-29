<?php

namespace App\Observers;

use App\Models\MonthlyBill;
use App\Models\Wallet;

class MonthlyBillObserver
{
    public function created(MonthlyBill $bill)
    {
        if ($bill->status === MonthlyBill::STATUS_PAID && $bill->wallet_id) {
            $this->adjustWalletBalance($bill->wallet_id, -($bill->paid_amount ?? $bill->expected_amount));
        }
    }

    public function updated(MonthlyBill $bill)
    {
        $wasPaid = $bill->getOriginal('status') === MonthlyBill::STATUS_PAID;
        $isPaid = $bill->status === MonthlyBill::STATUS_PAID;

        $oldWalletId = $bill->getOriginal('wallet_id');
        $newWalletId = $bill->wallet_id;

        $oldAmount = $bill->getOriginal('paid_amount') ?? $bill->getOriginal('expected_amount');
        $newAmount = $bill->paid_amount ?? $bill->expected_amount;

        if ($wasPaid && !$isPaid) {
            // Unpaid: refund old wallet
            if ($oldWalletId) {
                $this->adjustWalletBalance($oldWalletId, $oldAmount);
            }
        } elseif (!$wasPaid && $isPaid) {
            // Paid: deduct from new wallet
            if ($newWalletId) {
                $this->adjustWalletBalance($newWalletId, -$newAmount);
            }
        } elseif ($isPaid && $wasPaid) {
            // Still paid, check if wallet or amount changed
            if ($oldWalletId !== $newWalletId) {
                if ($oldWalletId) {
                    $this->adjustWalletBalance($oldWalletId, $oldAmount);
                }
                if ($newWalletId) {
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
    }

    public function deleted(MonthlyBill $bill)
    {
        if ($bill->status === MonthlyBill::STATUS_PAID && $bill->wallet_id) {
            $this->adjustWalletBalance($bill->wallet_id, $bill->paid_amount ?? $bill->expected_amount);
        }
    }

    public function restored(MonthlyBill $bill)
    {
        if ($bill->status === MonthlyBill::STATUS_PAID && $bill->wallet_id) {
            $this->adjustWalletBalance($bill->wallet_id, -($bill->paid_amount ?? $bill->expected_amount));
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
