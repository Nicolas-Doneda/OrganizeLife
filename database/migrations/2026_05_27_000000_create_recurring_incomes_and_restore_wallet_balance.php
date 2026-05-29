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
        // 1. Restore balance column to wallets
        Schema::table('wallets', function (Blueprint $table) {
            $table->decimal('balance', 12, 2)->default(0)->after('icon');
        });

        // 2. Create recurring_incomes table
        Schema::create('recurring_incomes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wallet_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->decimal('amount', 12, 2);
            $table->unsignedTinyInteger('receive_day');
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'active']);
            $table->index(['user_id', 'receive_day']);
        });

        // 3. Add recurring_income_id to incomes table and drop type column
        Schema::table('incomes', function (Blueprint $table) {
            $table->foreignId('recurring_income_id')
                ->nullable()
                ->after('wallet_id')
                ->constrained('recurring_incomes')
                ->onDelete('set null');

            $table->dropColumn('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incomes', function (Blueprint $table) {
            $table->dropForeign(['recurring_income_id']);
            $table->dropColumn('recurring_income_id');
            $table->enum('type', ['fixed', 'variable'])->default('fixed')->after('amount');
        });

        Schema::dropIfExists('recurring_incomes');

        Schema::table('wallets', function (Blueprint $table) {
            $table->dropColumn('balance');
        });
    }
};
