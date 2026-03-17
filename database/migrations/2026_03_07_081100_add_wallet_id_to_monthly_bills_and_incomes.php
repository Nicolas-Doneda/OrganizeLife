<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monthly_bills', function (Blueprint $table) {
            $table->foreignId('wallet_id')->nullable()->after('category_id')->constrained('wallets')->nullOnDelete();
        });

        Schema::table('incomes', function (Blueprint $table) {
            $table->foreignId('wallet_id')->nullable()->after('status')->constrained('wallets')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('monthly_bills', function (Blueprint $table) {
            $table->dropConstrainedForeignId('wallet_id');
        });

        Schema::table('incomes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('wallet_id');
        });
    }
};
