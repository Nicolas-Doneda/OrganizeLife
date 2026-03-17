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
        Schema::table('users', function (Blueprint $table) {
            $table->integer('budget_needs_percent')->default(50);
            $table->integer('budget_wants_percent')->default(30);
            $table->integer('budget_savings_percent')->default(20);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['budget_needs_percent', 'budget_wants_percent', 'budget_savings_percent']);
        });
    }
};
