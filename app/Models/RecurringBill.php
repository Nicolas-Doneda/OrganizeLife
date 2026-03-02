<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class RecurringBill extends Model
{
    use HasFactory, SoftDeletes;

    //MASS ASSIGNMENT

    protected $fillable = [
        'category_id',
        'name',
        'due_day',
        'expected_amount',
        'active',
    ];

    //CASTS

    protected $casts = [
        'expected_amount' => 'decimal:2', // 1500.00
        'active' => 'boolean', // true/false
        'due_day' => 'integer' // 1-31
    ];

    //RELACIONAMENTOS

    //EXPLICAÇÃO: Uma conta recorrente PERTENCE A um usuário
    //Uso: $recurringBill->user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    //EXPLICAÇÃO: Uma conta recorrente PERTENCE A uma categoria (nullable)
    //Uso: $recurringBill->category
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    //EXPLICAÇÃO: Uma conta recorrente TEM MUITAS contas mensais
    //Uso: $recurringBill->monthlyBills
    //Essas são as "instâncias" geradas mês a mês
    public function monthlyBills()
    {
        return $this->hasMany(MonthlyBill::class);
    }

    //SCOPES

    //EXPLICAÇÃO: Busca apenas contas ativas
    //Uso: RecurringBill::active()->get()
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    //EXPLICAÇÃO: Busca apenas contas inativas
    //Uso: RecurringBill::inactive()->get()
    public function scopeInactive($query)
    {
        return $query->where('active', false);
    }

    //EXPLICAÇÃO: Busca por dia de vencimento
    //Uso: RecurringBill::dueOnDay(5)->get()
    public function scopeDueOnDay($query, int $day)
    {
        return $query->where('due_day', $day);
    }

    //MÉTODOS AUXILIARES

    //EXPLICAÇÃO: Ativa a conta recorrente
    //Uso: $recurringBill->activate()
    public function activate():void
    {
        $this->update(['active' => true]);
    }

    //EXPLICAÇÃO: Desativa a conta recorrente
    //Uso: $recurringBill->deactivate()
    public function deactivate(): void
    {
        $this->update(['active' => false]);
    }

    //EXPLICAÇÃO: Conta quantas instâncias mensais foram geradas
    //Uso: $recurringBill->getGeneratedCount()
    public function getGeneratedCount(): int
    {
        return $this->monthlyBills()->count();
    }

    //EXPLICAÇÃO: Conta quantas foram pagas
    //Uso: $recurringBill->getPaidCount()
    public function getPaidCount(): int
    {
        return $this->monthlyBills()->where('status', 'paid')->count();
    }

    //EXPLICAÇÃO: Calcula total pago dessa recorrente
    //Uso: $recurringBill->getTotalPaid()
    public function getTotalPaid(): float
    {
        return (float) $this->monthlyBills()
            ->where('status', 'paid')
            ->sum('paid_amount');
    }

    //EXPLICAÇÃO: Formata valor para exibição
    //Uso: $recurringBill->getFormattedAmount()
    //Retorna: "R$ 1.500,00"
    public function getFormattedAmount(): string
    {
        return 'R$' . number_format($this->expected_amount, 2, ',', '.');
    }

}
