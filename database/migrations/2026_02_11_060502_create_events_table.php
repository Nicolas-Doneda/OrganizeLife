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
        Schema::create('events', function (Blueprint $table) {
            $table->id();

            //Foreign key para users
            $table->foreignId('user_id')
                ->constrained('users')
                ->onDelete('cascade');

            //Título do evento
            $table->string('title',120);

            //Descrição (opcional)
            $table->text('description')->nullable();

            //Evento de dia inteiro ou com horário específico?
            //EXPLICAÇÃO:
            //true = "Aniversário" (dia inteiro, sem hora)
            //false = "Reunião às 14h (horário específico)
            $table->boolean('all_day')->default(false);

            //Data de início
            $table->date('start_date');

            //Data de fim (opcional - para eventos de múltiplos dias)
            //EXPLICAÇÃO: NULL = evento de 1 dia só
            //Exemplo: Viagem de 15/01 até 20/01 (start_date + end_date)
            $table->date('end_date')->nullable();

            //Lembrete (notificação)
            //EXPLICAÇÃO: QUANDO o sistema deve notificar o usuário
            //Exemplo: Evento dia 15/01 às 14h -> reminder_at = 15/01 às 13h (1h antes)
            //NULL = sem lembrete
            $table->timestamp('reminder_at')->nullable();

            //Prioridade(1 = alta, 2 = normal, 3 - baixa)
            //EXPLICAÇÃO: Para destcar visualmente no calendário
            //1 = vermelhor(urgente)
            //2 = azul(normal)
            //3 = cinza(baixa prioridade)
            $table->unsignedTinyInteger('priority')->default(2);

            $table->timestamps();
            $table->softDeletes();

            //Índices para performance
            $table->index(['user_id', 'start_date']);
            $table->index(['user_id', 'priority']);
            $table->index(['user_id', 'reminder_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
