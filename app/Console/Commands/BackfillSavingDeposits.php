<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Saving;
use App\Models\SavingDeposit;

class BackfillSavingDeposits extends Command
{
    protected $signature = 'savings:backfill-deposits';
    protected $description = 'Sincroniza depósitos: limpa órfãos e cria registros faltantes.';

    public function handle()
    {
        // 1. Limpar depósitos órfãos (caixinhas soft-deleted)
        $activeIds = Saving::pluck('id');
        $orphaned = SavingDeposit::whereNotIn('saving_id', $activeIds)->count();
        SavingDeposit::whereNotIn('saving_id', $activeIds)->delete();
        $this->info("Depósitos órfãos removidos: {$orphaned}");

        // 2. Backfill caixinhas que existem mas não têm depósito
        $savings = Saving::where('current_amount', '>', 0)->get();
        $count = 0;

        foreach ($savings as $saving) {
            $exists = SavingDeposit::where('saving_id', $saving->id)->exists();
            if (!$exists) {
                SavingDeposit::create([
                    'user_id' => $saving->user_id,
                    'saving_id' => $saving->id,
                    'amount' => $saving->current_amount,
                    'deposit_date' => $saving->updated_at->toDateString(),
                ]);
                $count++;
            }
        }

        $this->info("Retroalimentados: {$count} depósitos de {$savings->count()} caixinhas.");
    }
}
