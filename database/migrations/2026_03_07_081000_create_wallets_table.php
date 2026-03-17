<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->string('color', 20)->default('blue');
            $table->string('icon', 30)->default('wallet');
            $table->decimal('balance', 12, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'name', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
