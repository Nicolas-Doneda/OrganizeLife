<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class MonthlyBill extends Model
{
    use HasFactory, SoftDeletes;

    //MASS ASSIGNMENT

    protected $fillable = [
        'recurring_bill_id',
        'category_id',
        'year',
        'month',
        'name_snapshot',
        'expected_amount',
        'due_date',
        'source_uid',
        'paid_amount',
        'paid_at',
        'status',
        'notes',
    ];

    //CASTS

    //EXPLICAÇÃO: Casts convertem automaticamente os tipos ao ler/escrever
    //decimal:2 = sempre mantém 2 casas decimais (nunca use float para dinheiro!)
    //date = converte para Carbon (objeto de data do Laravel)
    //datetime = converte para Carbon com hora inclusa
    //integer = garante que year e month sejam números, não strings
    protected $casts = [
        'expected_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'year' => 'integer',
        'month' => 'integer',
    ];

    //STATUS CONSTANTS
    //EXPLICAÇÃO: Usar constantes evita "magic strings" espalhadas pelo código
    //Em vez de escrever 'paid' em 10 lugares, usa self::STATUS_PAID
    //Se precisar mudar o valor, muda em UM lugar só

    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';
    public const STATUS_OVERDUE = 'overdue';
    public const STATUS_CANCELED = 'canceled';

    //EXPLICAÇÃO: Array de todos os status válidos
    //Útil para validação: Rule::in(MonthlyBill::VALID_STATUSES)
    public const VALID_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PAID,
        self::STATUS_OVERDUE,
        self::STATUS_CANCELED,
    ];

    //RELACIONAMENTOS

    //EXPLICAÇÃO: Uma conta mensal PERTENCE A um usuário
    //Uso: $monthlyBill->user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    //EXPLICAÇÃO: Uma conta mensal PODE pertencer a uma conta recorrente
    //Uso: $monthlyBill->recurringBill
    //PODE SER NULL: contas avulsas não têm recorrente
    public function recurringBill()
    {
        return $this->belongsTo(RecurringBill::class);
    }

    //EXPLICAÇÃO: Uma conta mensal PODE pertencer a uma categoria
    //Uso: $monthlyBill->category
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    //SCOPES (filtros reutilizáveis)

    //EXPLICAÇÃO: Filtra contas de um mês/ano específico
    //Uso: MonthlyBill::forMonth(2026, 2)->get()
    //Retorna: todas as contas de fevereiro/2026
    public function scopeForMonth($query, int $year, int $month)
    {
        return $query->where('year', $year)->where('month', $month);
    }

    //EXPLICAÇÃO: Filtra por status
    //Uso: MonthlyBill::withStatus('paid')->get()
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    //EXPLICAÇÃO: Apenas contas pendentes
    //Uso: MonthlyBill::pending()->get()
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    //EXPLICAÇÃO: Apenas contas pagas
    //Uso: MonthlyBill::paid()->get()
    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    //EXPLICAÇÃO: Apenas contas atrasadas
    //Uso: MonthlyBill::overdue()->get()
    public function scopeOverdue($query)
    {
        return $query->where('status', self::STATUS_OVERDUE);
    }

    //EXPLICAÇÃO: Contas que vencem hoje ou já venceram (e estão pendentes)
    //Uso: MonthlyBill::dueSoonOrOverdue()->get()
    //POR QUÊ? Para um job/cron atualizar status automaticamente
    public function scopeDueSoonOrOverdue($query)
    {
        return $query->where('status', self::STATUS_PENDING)
            ->where('due_date', '<=', now()->toDateString());
    }

    //MÉTODOS AUXILIARES

    //EXPLICAÇÃO: Marca a conta como PAGA
    //Uso: $monthlyBill->markAsPaid(150.00)
    //Se não passar valor, usa o expected_amount como padrão
    //POR QUÊ paid_amount separado? Porque às vezes você paga valor diferente
    //Exemplo: Conta de luz esperada R$ 200, veio R$ 180
    public function markAsPaid(?float $paidAmount = null): void
    {
        $this->update([
            'status' => self::STATUS_PAID,
            'paid_amount' => $paidAmount ?? $this->expected_amount,
            'paid_at' => now(),
        ]);
    }

    //EXPLICAÇÃO: Marca como ATRASADA
    //Uso: $monthlyBill->markAsOverdue()
    //Chamado automaticamente pelo sistema quando due_date < hoje
    public function markAsOverdue(): void
    {
        $this->update(['status' => self::STATUS_OVERDUE]);
    }

    //EXPLICAÇÃO: Cancela a conta
    //Uso: $monthlyBill->cancel()
    //Diferente de deletar! Cancelar mantém o registro para histórico
    public function cancel(): void
    {
        $this->update(['status' => self::STATUS_CANCELED]);
    }

    //EXPLICAÇÃO: Verifica se a conta está paga
    //Uso: if ($monthlyBill->isPaid()) { ... }
    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    //EXPLICAÇÃO: Verifica se está pendente
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    //EXPLICAÇÃO: Verifica se está atrasada
    public function isOverdue(): bool
    {
        return $this->status === self::STATUS_OVERDUE;
    }

    //EXPLICAÇÃO: Formata valor esperado para exibição
    //Uso: $monthlyBill->getFormattedExpectedAmount()
    //Retorna: "R$ 1.500,00"
    public function getFormattedExpectedAmount(): string
    {
        return 'R$ ' . number_format($this->expected_amount, 2, ',', '.');
    }

    //EXPLICAÇÃO: Formata valor pago para exibição
    //Retorna: "R$ 1.450,00" ou "—" se não pagou
    public function getFormattedPaidAmount(): string
    {
        if ($this->paid_amount === null) {
            return '—';
        }

        return 'R$ ' . number_format($this->paid_amount, 2, ',', '.');
    }

    //EXPLICAÇÃO: Retorna nome legível do mês em português
    //Uso: $monthlyBill->getMonthName()
    //Retorna: "Fevereiro"
    public function getMonthName(): string
    {
        $months = [
            1 => 'Janeiro', 2 => 'Fevereiro', 3 => 'Março',
            4 => 'Abril', 5 => 'Maio', 6 => 'Junho',
            7 => 'Julho', 8 => 'Agosto', 9 => 'Setembro',
            10 => 'Outubro', 11 => 'Novembro', 12 => 'Dezembro',
        ];

        return $months[$this->month] ?? '';
    }

    //EXPLICAÇÃO: Retorna referência completa do período
    //Uso: $monthlyBill->getPeriodLabel()
    //Retorna: "Fevereiro/2026"
    public function getPeriodLabel(): string
    {
        return $this->getMonthName() . '/' . $this->year;
    }
}
