<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Event extends Model
{
    use HasFactory, SoftDeletes;

    //MASS ASSIGNMENT

    protected $fillable = [
        'title',
        'description',
        'all_day',
        'start_date',
        'end_date',
        'reminder_at',
        'priority',
        'recurrence_type',
        'recurrence_interval',
        'recurrence_days',
        'recurrence_end',
    ];

    //CASTS

    protected $casts = [
        'all_day' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
        'reminder_at' => 'datetime',
        'priority' => 'integer',
        'recurrence_days' => 'array',
        'recurrence_end' => 'date',
    ];

    //PRIORITY CONSTANTS
    //EXPLICAÇÃO: Mesmo padrão das constants do MonthlyBill
    //Evita "magic numbers" espalhados — 1, 2, 3 não dizem nada
    //self::PRIORITY_HIGH é claro e auto-documentado

    public const PRIORITY_HIGH = 1;
    public const PRIORITY_NORMAL = 2;
    public const PRIORITY_LOW = 3;

    public const VALID_PRIORITIES = [
        self::PRIORITY_HIGH,
        self::PRIORITY_NORMAL,
        self::PRIORITY_LOW,
    ];

    //EXPLICAÇÃO: Mapa legível de prioridades em português
    //Uso: Event::PRIORITY_LABELS[1] retorna "Alta"
    //Útil para exibir no frontend e em relatórios
    public const PRIORITY_LABELS = [
        self::PRIORITY_HIGH => 'Alta',
        self::PRIORITY_NORMAL => 'Normal',
        self::PRIORITY_LOW => 'Baixa',
    ];

    //RELACIONAMENTOS

    //EXPLICAÇÃO: Um evento PERTENCE A um usuário
    //Uso: $event->user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    //SCOPES (filtros reutilizáveis)

    //EXPLICAÇÃO: Filtra por prioridade
    //Uso: Event::withPriority(1)->get() (eventos urgentes)
    public function scopeWithPriority($query, int $priority)
    {
        return $query->where('priority', $priority);
    }

    //EXPLICAÇÃO: Filtra eventos dentro de um intervalo de datas
    //Uso: Event::between('2026-02-01', '2026-02-28')->get()
    //POR QUÊ? Para mostrar eventos no calendário mensal
    //Usa whereBetween no start_date — pega tudo que COMEÇA nesse período
    public function scopeBetween($query, string $startDate, string $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            //Evento começa dentro do período
            $q->whereBetween('start_date', [$startDate, $endDate])
              //OU evento termina dentro do período (para eventos multi-dia)
              ->orWhereBetween('end_date', [$startDate, $endDate])
              //OU evento ENGLOBA todo o período (começou antes + termina depois)
              ->orWhere(function ($q2) use ($startDate, $endDate) {
                  $q2->where('start_date', '<=', $startDate)
                      ->where('end_date', '>=', $endDate);
              });
        });
    }

    //EXPLICAÇÃO: Próximos eventos (a partir de hoje)
    //Uso: Event::upcoming()->limit(5)->get()
    //Ordena por start_date para mostrar o mais próximo primeiro
    public function scopeUpcoming($query)
    {
        return $query->where('start_date', '>=', now()->toDateString())
            ->orderBy('start_date', 'asc');
    }

    //EXPLICAÇÃO: Eventos passados
    //Uso: Event::past()->get()
    public function scopePast($query)
    {
        return $query->where('start_date', '<', now()->toDateString())
            ->orderBy('start_date', 'desc');
    }

    //EXPLICAÇÃO: Eventos que têm lembrete configurado e ainda não foram notificados
    //Uso: Event::withPendingReminder()->get()
    //POR QUÊ? Para um job/cron verificar e enviar notificações
    public function scopeWithPendingReminder($query)
    {
        return $query->whereNotNull('reminder_at')
            ->where('reminder_at', '<=', now());
    }

    //MÉTODOS AUXILIARES

    //EXPLICAÇÃO: Verifica se é evento de dia inteiro
    //Uso: if ($event->isAllDay()) { ... }
    public function isAllDay(): bool
    {
        return $this->all_day === true;
    }

    //EXPLICAÇÃO: Verifica se o evento já passou
    //Uso: if ($event->isPast()) { ... }
    //Compara start_date com a data de hoje
    public function isPast(): bool
    {
        return $this->start_date->isPast();
    }

    //EXPLICAÇÃO: Verifica se o evento é hoje
    //Uso: if ($event->isToday()) { ... }
    public function isToday(): bool
    {
        return $this->start_date->isToday();
    }

    //EXPLICAÇÃO: Verifica se é um evento futuro
    public function isUpcoming(): bool
    {
        return $this->start_date->isFuture();
    }

    //EXPLICAÇÃO: Verifica se o evento dura múltiplos dias
    //Uso: if ($event->isMultiDay()) { ... }
    //Exemplo: Viagem de 3 dias (start_date != end_date)
    public function isMultiDay(): bool
    {
        return $this->end_date !== null
            && !$this->start_date->equalTo($this->end_date);
    }

    //EXPLICAÇÃO: Retorna o label da prioridade em português
    //Uso: $event->getPriorityLabel()
    //Retorna: "Alta", "Normal" ou "Baixa"
    public function getPriorityLabel(): string
    {
        return self::PRIORITY_LABELS[$this->priority] ?? 'Normal';
    }

    //EXPLICAÇÃO: Calcula quantos dias faltam para o evento
    //Uso: $event->getDaysUntil()
    //Retorna: 5 (faltam 5 dias) ou -2 (passou há 2 dias)
    public function getDaysUntil(): int
    {
        return (int) now()->startOfDay()->diffInDays($this->start_date, false);
    }

    //EXPLICAÇÃO: Retorna duração do evento em dias
    //Uso: $event->getDurationInDays()
    //Retorna: 1 (evento de 1 dia) ou 3 (viagem de 3 dias)
    public function getDurationInDays(): int
    {
        if ($this->end_date === null) {
            return 1;
        }

        return (int) $this->start_date->diffInDays($this->end_date) + 1;
    }
}
