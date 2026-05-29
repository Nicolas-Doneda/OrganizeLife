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
        'google_id',
        'password',
        'avatar',
        'theme_color',
        'email_verified_at',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'budget_needs_percent',
        'budget_wants_percent',
        'budget_savings_percent',
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

    //EXPLICAÇÃO: Um usuário TEM MUITAS rendas
    //Uso: $user->incomes
    public function incomes()
    {
        return $this->hasMany(Income::class);
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

    //EXPLICAÇÃO: Um usuário TEM MUITAS carteiras
    //Uso: $user->wallets
    public function wallets()
    {
        return $this->hasMany(Wallet::class);
    }

    public function savings()
    {
        return $this->hasMany(Saving::class);
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
        if ($this->avatar) {
            if (str_starts_with($this->avatar, 'http://') || str_starts_with($this->avatar, 'https://')) {
                return $this->avatar;
            }
            if (str_starts_with($this->avatar, '#')) {
                return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&color=FFFFFF&background=' . str_replace('#', '', $this->avatar);
            }
            return asset('storage/' . $this->avatar);
        }

        //Avatar padrão (usando UI Avatars - serviço grátis)
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&color=7F9CF5&background=EBF4FF';
    }

    public function savingDeposits()
    {
        return $this->hasMany(SavingDeposit::class);
    }

    /**
     * Retorna todas as contas mensais do usuário para o período, 
     * injetando virtualmente previsões das contas recorrentes ativas.
     */
    public function getMonthlyBillsWithVirtual(int $year, int $month)
    {
        // 1. Busca contas reais do banco de dados
        $bills = $this->monthlyBills()
            ->with(['category', 'recurringBill'])
            ->forMonth($year, $month)
            ->get();

        // 2. Busca contas recorrentes ativas
        $activeRecurring = $this->recurringBills()
            ->with('category')
            ->where('active', true)
            ->get();

        $existingRecurringIds = $bills->pluck('recurring_bill_id')->filter()->toArray();

        foreach ($activeRecurring as $recur) {
            if (!in_array($recur->id, $existingRecurringIds)) {
                $dueDay = min($recur->due_day, \Carbon\Carbon::createFromDate($year, $month, 1)->endOfMonth()->day);
                $dueDate = \Carbon\Carbon::createFromDate($year, $month, $dueDay)->toDateString();

                $status = MonthlyBill::STATUS_PENDING;
                if ($dueDate < now()->toDateString()) {
                    $status = MonthlyBill::STATUS_OVERDUE;
                }

                $virtualBill = new MonthlyBill([
                    'recurring_bill_id' => $recur->id,
                    'category_id' => $recur->category_id,
                    'year' => $year,
                    'month' => $month,
                    'name_snapshot' => $recur->name,
                    'expected_amount' => $recur->expected_amount,
                    'due_date' => $dueDate,
                    'status' => $status,
                    'paid_amount' => null,
                    'paid_at' => null,
                ]);

                // Define ID virtual contendo todas as variáveis necessárias para materialização posterior
                $virtualBill->id = "virtual-{$recur->id}-{$year}-{$month}";
                $virtualBill->incrementing = false;
                
                if ($recur->category_id) {
                    $virtualBill->setRelation('category', $recur->category);
                }
                $virtualBill->setRelation('recurringBill', $recur);
                
                $virtualBill->_virtual = true;
                $virtualBill->_recurring = true;

                $bills->push($virtualBill);
            }
        }

        return $bills->sortBy('due_date')->values();
    }

    public function recurringIncomes()
    {
        return $this->hasMany(RecurringIncome::class);
    }

    /**
     * Retorna todas as rendas mensais do usuário para o período, 
     * injetando virtualmente previsões das rendas recorrentes ativas.
     */
    public function getIncomesWithVirtual(int $year, int $month)
    {
        // 1. Busca rendas reais do banco de dados (eager loading wallet)
        $incomes = $this->incomes()
            ->with('wallet')
            ->where(function ($query) use ($year, $month) {
                $startDate = \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
                $endDate = \Carbon\Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();
                $query->whereBetween('expected_date', [$startDate, $endDate]);
            })
            ->get();

        // 2. Busca rendas recorrentes ativas
        $activeRecurring = $this->recurringIncomes()
            ->with('wallet')
            ->where('active', true)
            ->get();

        $existingRecurringIds = $incomes->pluck('recurring_income_id')->filter()->toArray();

        foreach ($activeRecurring as $recur) {
            if (!in_array($recur->id, $existingRecurringIds)) {
                $receiveDay = min($recur->receive_day, \Carbon\Carbon::createFromDate($year, $month, 1)->endOfMonth()->day);
                $expectedDate = \Carbon\Carbon::createFromDate($year, $month, $receiveDay)->toDateString();

                $virtualIncome = new Income([
                    'recurring_income_id' => $recur->id,
                    'wallet_id' => $recur->wallet_id,
                    'name' => $recur->name,
                    'amount' => $recur->amount,
                    'expected_date' => $expectedDate,
                    'status' => 'pending',
                ]);

                // Define ID virtual contendo todas as variáveis necessárias para materialização posterior
                $virtualIncome->id = "virtual-{$recur->id}-{$year}-{$month}";
                $virtualIncome->incrementing = false;
                
                if ($recur->wallet_id) {
                    $virtualIncome->setRelation('wallet', $recur->wallet);
                }
                
                $virtualIncome->_virtual = true;
                $virtualIncome->_recurring = true;

                $incomes->push($virtualIncome);
            }
        }

        return $incomes->sortBy('expected_date')->values();
    }
}
