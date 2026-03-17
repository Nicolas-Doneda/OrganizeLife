<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    //MASS ASSIGNMENT

    protected $fillable = [
        'name',
        'color',
        'icon',
        'budget_group',
    ];

    //CASTS

    //EXPLICAÇÃO: Não precisa de casts aqui
    //Todos os campos já são strings simples
    protected $casts = [
        //Vazio por  enquanto
    ];

    //RELACIONAMENTOS

    //EXPLICAÇÃO: Uma categoria PERTENCE A um usuário
    //Uso: $category->user (retorna User)
    //Inverso de: $user->categories
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    //EXPLICAÇÃO: Uma categoria TEM MUITAS contas recorrentes
    //Uso: $category->recurringBills
    public function recurringBills()
    {
        return $this->hasMany(RecurringBill::class);
    }

    //EXPLICAÇÃO: Uma categoria TEM MUITAS contas mensais
    //Uso: $category->monthlyBills
    public function monthlyBills()
    {
        return $this->hasMany(MonthlyBill::class);
    }

    //SCOPES (filtros reutilizáveis)

    //EXPLICAÇÃO: Busca categorias por cor
    //Uso: Category::byColor('blue')->get()
    public function scopeByColor($query, string $color)
    {
        return $query->where('color', $color);
    }

    //EXPLICAÇÃO: Busca por nome (case-insensitive)
    //Uso: Category::searchByName('aliment')->get()
    public function scopeSearchByName($query, string $search)
    {
        return $query->where('name', 'like', "%{$search}%");
    }

    //MÉTODOS AUXILIARES

    //EXPLICAÇÃO: Conta quantas contas recorrentes tem nessa categoria
    //Uso: $category->getRecurringBillsCount()
    public function getRecurringBillsCount(): int
    {
        return $this->recurringBills()->count();
    }

    //EXPLICAÇÃO: Conta quantas contas mensais tem enssa categoria
    //Uso: $category->getMonthlyBillsCount()
    public function getMonthlyBillsCount(): int
    {
        return $this->monthlyBills()->count();
    }
}
