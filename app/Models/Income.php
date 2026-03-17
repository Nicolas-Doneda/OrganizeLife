<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Income extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'name',
        'amount',
        'type',
        'expected_date',
        'date',
        'is_paid',
        'wallet_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expected_date' => 'date',
    ];

    public function scopePending($query)
    {
        return $query->where('is_paid', false);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }
}
