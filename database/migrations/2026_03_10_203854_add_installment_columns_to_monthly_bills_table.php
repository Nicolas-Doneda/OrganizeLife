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
        Schema::table('monthly_bills', function (Blueprint $table) {
            $table->string('installment_group_id')->nullable()->index();
            $table->integer('installment_index')->nullable();
            $table->integer('installment_total')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monthly_bills', function (Blueprint $table) {
            $table->dropIndex(['installment_group_id']);
            $table->dropColumn([
                'installment_group_id',
                'installment_index',
                'installment_total'
            ]);
        });
    }
};
