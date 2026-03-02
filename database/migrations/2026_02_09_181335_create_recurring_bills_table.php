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
        Schema::create('recurring_bills', function (Blueprint $table) {
            $table->id();

            //Foreign key para users
            $table->foreignId('user_id')
                ->constrained('users')
                ->onDelete('cascade');

            //Foreign key para categories (PODE SER NULL)
            //EXPLICAÇÃO: onDelete('set null') = se deletar a categoria,
            //a conta continua existindo mas category_id vira NULL
            $table->foreignId('category_id')
                ->nullable()
                ->constrained('categories')
                ->onDelete('set null');

            //Nome da conta recorrente (ex: "Aluguel", "Netflix")
            $table->string('name', 120);

            //Dia do vencimento(1 a 31)
            //EXPLICAÇÃO: unsignedTinyInteger = número de - a 255 (economiza espaço)
            //Usamos para guardar o dia do mês: 1, 5, 10, 15, 30, etc
            //ATENÇÂO: Meses com menos de 31 dias vamos tratar no código (service)
            $table->unsignedTinyInteger('due_day');

            //Valor esperado da conta
            //EXPLICAÇÃO: decimal(12, 2) = até 9.999.999.999,99
            //12 dígitos totaism sendo 2 depois da vírgula
            //NUNCA use float/double para dinheiro! Sempre decimal!
            $table->decimal('expected_amount', 12, 2)->default(0);

            //Conta ativa ou inativa
            //EXPLICAÇÃO: Se active = false, não gera mais contas mensais
            //Útil para pausar uma conta sem deletar (ex: cancelou Netflix)
            $table->boolean('active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            //Índices para performance
            $table->index(['user_id', 'active']);
            $table->index(['user_id', 'due_day']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recurring_bills');
    }
};
