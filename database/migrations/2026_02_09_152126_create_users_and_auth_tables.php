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

        //TABELA USERS
        Schema::create('users', function (Blueprint $table) {
            $table->id(); //primary key auto-increment

            //Dados básicos do usuário
            $table->string('name');
            $table->string('email')->unique(); //Email único (não pode duplicar)

            //Avatar(foto de perfil)
            //EXPLICAÇÃO: Guarda o caminho da imagem, não a imagem em si
            //Exemplo: "avatars/user_123.jpg"
            //NULL = usuário não tem foto (usa avatar padrão)
            $table->string('avatar')->nullable();

            //Cor de tema preferida (ex: "blue", "purple", "green")
            //EXPLICAÇÃO: Para personalização da interface
            $table->string('theme_color', 20)->default('blue');

            $table->timestamp('email_verified_at')->nullable(); // NULL = email não verificado
            $table->string('password');

            //2FA (Two-Factor Authentication)
            //EXPLICAÇÂO: Guarda o código do google Authenticator
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable(); //Códigos de recuperação
            $table->timestamp('two_factor_confirmed_at')->nullable(); //Quando ativou o 2FA

            //Suspensão de conta
            //EXPLICAÇÂO: Se suspended_at NÂO for NULL, a conta está suspensa
            $table->timestamp('suspended_at')->nullable();
            $table->text('suspension_reason')->nullable(); //Motivo da suspensão

            //Remember me (manter login)
            $table->rememberToken();

            //Timestamps automáticos(created_at, updated_at)
            $table->timestamps();

            //Soft delete (deleted_at)
            //EXPLICAÇÃO: Quando você "deleta", só preenche deleted_at
            //O registro continua no banco mas fica "invisível"
            $table->softDeletes();

            //Índices para performance
            //EXPLICAÇÃO: Acelera buscas por email e created_at
            $table->index('email');
            $table->index('created_at');

        });

        //TABELA password_reset_tokens

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary(); //Email é a chave primária
            $table->string('token'); //Token de reset
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();


            //Foreign key para users(pode ser NULL se for guest)
            //EXPLICAÇÂO: Quando o usuário é deletado, as sessões também são
            $table->foreignId('user_id')->nullable()->index();

            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //EXPLICAÇÃO: Método down() é executado quando você faz rollback
        //Sempre na ordem INVERSA da criação(por causa das foreign keys)
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
