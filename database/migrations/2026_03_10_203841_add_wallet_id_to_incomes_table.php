<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Só adiciona se não existir (evita crash se a coluna já foi adicionada em outra migration falha)
        if (!Schema::hasColumn('incomes', 'wallet_id')) {
            Schema::table('incomes', function (Blueprint $table) {
                $table->foreignId('wallet_id')->nullable()->constrained('wallets')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incomes', function (Blueprint $table) {
            $table->dropForeign(['wallet_id']);
            $table->dropColumn('wallet_id');
        });
    }
};
