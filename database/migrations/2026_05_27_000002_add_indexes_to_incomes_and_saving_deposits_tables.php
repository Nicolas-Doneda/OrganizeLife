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
        Schema::table('incomes', function (Blueprint $table) {
            $table->index(['user_id', 'expected_date']);
        });

        Schema::table('saving_deposits', function (Blueprint $table) {
            $table->index(['user_id', 'deposit_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('saving_deposits', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'deposit_date']);
        });

        Schema::table('incomes', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'expected_date']);
        });
    }
};
