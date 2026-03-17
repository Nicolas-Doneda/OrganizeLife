<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Wallet extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'color',
        'icon',
    ];

    protected $casts = [
    ];

    // RELACIONAMENTOS

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function monthlyBills()
    {
        return $this->hasMany(MonthlyBill::class);
    }

    public function incomes()
    {
        return $this->hasMany(Income::class);
    }
}
