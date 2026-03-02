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
        Schema::create('monthly_bills', function (Blueprint $table) {
            $table->id();

            //Foreign key para users
            $table->foreignId('user_id')
                ->constrained('users')
                ->onDelete('cascade');

            //Foreign key para recurring_bills (PODE SER NULL)
            //EXPLICAÇÃO: Pode ser NULL para contas AVULSAS (não recorrentes)
            //Exemplo: Você teve uma despesa inesperada e quer adicionar manualmente
            $table->foreignId('recurring_bill_id')
                ->nullable()
                ->constrained('recurring_bills')
                ->onDelete('set null');

            //Foreign key para categories (PODE SER NULL)
            $table->foreignId('category_id')
                ->nullable()
                ->constrained('categories')
                ->onDelete('set null');

            //Referência do mês
            //EXPLICAÇÃO: Guardamos ano e mês separados para facilitar queries
            //Exemplo: year = 2026, month = 2 (fevereiro)
            $table->unsignedSmallInteger('year'); // 0 a 65.535 (suficiente até ano 65.535)
            $table->unsignedTinyInteger('month'); // 1 a 12

            //Snapshot (congela o histórico)
            //EXPLICAÇÃO: Guardamos o nome e valor NO MOMENTO que a conta foi gerada
            //Por quê? Se você mudar o nome/valor da recorrente, não afeta o passado!
            //Exemplo: Aluguel era R$ 1.000, você mudou para R$ 1.200
            //Janeiro(passado) continua mostrando R$ 1.000 (snapshot)~
            $table->string('name_snapshot', 120);
            $table->decimal('expected_amount', 12, 2)->default(0);

            //Vencimento real daquela instância
            //EXPLICAÇÃO: A data completa de vencimento (05/01/2026)
            $table->date('due_date');

            //Chave única para evitar duplicatas
            //EXPLICAÇÃO: Garante que não crie a mesma conta 2x no mesmo mês
            //Vamos criar esse campo via código (não agora)
            $table->string('source_uid', 191);

            //Pagamento
            //EXPLICAÇÃO: Quando o usuário marca como "pago"
            $table->decimal('paid_amount', 12, 2)->nullable(); //valor real pago
            $table->timestamp('paid_at')->nullable(); //QUANDO pagou

            //Status da conta
            //EXPLICAÇÃO: pending | paid | overdue | canceled
            //pending = Ainda não pagou
            //paid = Já pagou
            //overdue = Atrasado (venceu e não pagou)
            //canceled = Cancelado (não vai pagar)
            $table->string('status', 20)->default('pending');

            //Observações
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            //Índice único composto
            //EXPLICAÇÃO: Um usuário NÃO pode ter 2 contas iguais no mesmo mês
            $table->unique(['user_id', 'year', 'month', 'source_uid'], 'uniq_monthly_bill');

            //Índices para performance
            //EXPLICAÇÃO: Vamos fazer MUITAS buscas por mês, status, etc
            $table->index(['user_id', 'year', 'month']);
            $table->index(['user_id', 'status', 'year', 'month']);
            $table->index(['user_id', 'due_date']);
            $table->index(['user_id', 'paid_at']);
            $table->index(['user_id', 'category_id', 'year', 'month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_bills');
    }
};
