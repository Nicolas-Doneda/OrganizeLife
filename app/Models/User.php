<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    //MASS ASSIGNMENT

    //EXPLICAÇÃO: Campos que podem ser preenchidos em massa
    //Exemplo: User::create(['name => 'João','email' => '...'])
    //Sem isso = erro de"mass assigment"
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'theme_color',
        'email_verified_at',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    //HIDDEN (Segurança)
    
    //EXPLICAÇÃO: Campos OCULTOS ao converter para JSON
    //Por segurança, nunca envie senha ou tokens 2FA para o frontend!
    //Quando fizer: return response()->json($user)
    //Esses campos NÃO vão aparecer
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    //CASTS (Conversão automática de tipos)

    //EXPLICAÇÃO: Converte campos para tipos específicos
    //email_verified_at vira objeto Carbon (para manipular datas)
    //password é automaticamente hasheado (criptografado)
    protected $casts = [
        'email_verified_at' => 'datetime',
        'two_factor_confirmed_at' => 'datetime',
        'suspended_at' => 'datetime',
        'password' => 'hashed',
    ];

    //RELACIONAMENTOS

    //EXPLICAÇÃO: Um usuário TEM MUITAS categorias
    //Uso: $user->categories (retorna Collection)
    //Criar: $user->categories()->create(['name' => '...'] )
    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    //EXPLICAÇÃO: Um usuário TEM MUITAS contas recorrentes
    //Uso: $user->recurringBills
    public function recurringBills()
    {
        return $this->hasMany(RecurringBill::class);
    }

    //EXPLICAÇÃO: Um usuário TEM MUITAS contas mensais
    //Uso: $user->monthlyBills
    public function monthlyBills()
    {
        return $this->hasMany(MonthlyBill::class);
    }

    //EXPLICAÇÃO: Um usuário TEM MUITOS eventos
    //Uso: $user->events
    public function events()
    {
        return $this->hasMany(Event::class);
    }

    //MÉTODOS AUXILIARES (helpers)

    //EXPLICAÇÃO: Verifica se o usuário está suspenso
    //Uso: if ($user->isSuspended()){...}
    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }

    //EXPLICAÇÃO: Suspende o usuário
    //Uso: $user->suspend('Violou termos de uso');
    public function suspend(string $reason): void 
    {
        $this->update([
            'suspended_at' => now(),
            'suspension_reason'=> $reason,

        ]);
    }

    //EXPLICAÇÃO: Remove a suspensão
    //Uso: $user->unsuspend();
    public function unsuspend(): void
    {
        $this->update([
            'suspended_at' => null,
            'suspension_reason' => null
        ]);
    }

    //EXPLICAÇÃO: Verifica se tem 2FA ativo
    //Uso: if ($user->hasTwoFactorEnabled()){...}
    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_secret !== null
            && $this->two_factor_confirmed_at !== null;
    }

    //EXPLICAÇÃO: Pega URL completa do avatar
    //Uso: $user->getAvatarUrl()
    //Retorna: https://organizelife.com/storage/avatars/user_123.jpg
    //Ou: URL padrão se não tiver avatar
    public function getAvatarUrl(): string
    {
        if($this->avatar){
            return asset('storage/' . $this->avatar);
        }

        //Avatar padrão (usando UI Avatars - serviço grátis)
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&color=7F9CF5&background=EBF4FF';
    }

}
