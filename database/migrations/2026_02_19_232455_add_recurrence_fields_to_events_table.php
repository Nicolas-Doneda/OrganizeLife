<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('recurrence_type', 20)->default('none');
            $table->unsignedSmallInteger('recurrence_interval')->nullable();
            $table->json('recurrence_days')->nullable();
            $table->date('recurrence_end')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'recurrence_type',
                'recurrence_interval',
                'recurrence_days',
                'recurrence_end',
            ]);
        });
    }
};
