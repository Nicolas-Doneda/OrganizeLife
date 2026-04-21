<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavingDeposit extends Model
{
    protected $fillable = [
        'user_id',
        'saving_id',
        'amount',
        'deposit_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'deposit_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function savingAccount()
    {
        return $this->belongsTo(Saving::class, 'saving_id');
    }
}
