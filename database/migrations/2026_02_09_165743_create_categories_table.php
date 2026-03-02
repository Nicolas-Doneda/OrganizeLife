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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            //Foreign key para users
            //EXPLICAÇÃO: Cada categoria pertence a UM usuário
            //onDelete('cascade') = Se deletar o usuário, deleta as categorias dele
            $table->foreignId('user_id')
                ->constrained('users')
                ->onDelete('cascade');

            //Nome da categoria (ex: "Moradia", "Alimentação")
            // EXPLICAÇÃO: Limite de 60 caracteres é suficiente
            $table->string('name', 60);

            //Cor para UI (Tailwind CSS)
            //EXPLICAÇÃO: Guarda cores tipo "blue", "red", "green", "purple"
            //Usamos no frontend para colorir os cards/badges
            $table->string('color',20)->default('gray');

            //Ícone (emoji ou código do ícone)
            //EXPLICAÇÃO: Pode guardar emoji ou nome de ícone "home"
            //NULL = usa ícone padrão no frontend
            $table->string('icon', 10)->nullable();

            $table->timestamps();
            $table->softDeletes();

            //Índice único composto
            //EXPLICAÇÃO: Um usuário NÃO pode ter 2 categorias com o mesmon ome
            //Mas usuários DIFERENTES podem ter categorias com nomes iguais
            $table->unique(['user_id', 'name']);

            //Índice para buscas
            $table->index(['user_id','name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
