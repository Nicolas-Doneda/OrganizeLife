<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    //INDEX - Listar eventos
    //EXPLICAÇÃO:
    //  Suporta 2 modos de listagem:
    //  1. Por período: GET /api/events?start=2026-02-01&end=2026-02-28 (para calendário)
    //  2. Todos: GET /api/events (ordena por data)
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->events();

        //Filtro por intervalo de datas (para o calendário mensal)
        if ($request->filled('start') && $request->filled('end')) {
            $query->between($request->input('start'), $request->input('end'));
        }

        //Filtro por prioridade (opcional)
        //Uso: GET /api/events?priority=1 (apenas urgentes)
        if ($request->filled('priority')) {
            $query->withPriority($request->integer('priority'));
        }

        $events = $query->orderBy('start_date')->get();

        return response()->json([
            'data' => $events,
        ]);
    }

    //STORE - Criar evento
    public function store(StoreEventRequest $request): JsonResponse
    {
        $event = $request->user()->events()->create(
            $request->validated()
        );

        return response()->json([
            'message' => 'Evento criado com sucesso.',
            'data' => $event,
        ], 201);
    }

    //SHOW - Exibir evento
    public function show(Request $request, int $id): JsonResponse
    {
        $event = $request->user()
            ->events()
            ->findOrFail($id);

        //EXPLICAÇÃO: Adiciona dados calculados ao retorno
        //Esses métodos vêm do Model Event que criamos
        //Retornamos como dados extras para o frontend usar
        return response()->json([
            'data' => $event,
            'meta' => [
                'is_past' => $event->isPast(),
                'is_today' => $event->isToday(),
                'is_upcoming' => $event->isUpcoming(),
                'is_multi_day' => $event->isMultiDay(),
                'days_until' => $event->getDaysUntil(),
                'duration_days' => $event->getDurationInDays(),
                'priority_label' => $event->getPriorityLabel(),
            ],
        ]);
    }

    //UPDATE - Atualizar evento
    public function update(UpdateEventRequest $request, int $id): JsonResponse
    {
        $event = $request->user()
            ->events()
            ->findOrFail($id);

        $event->update($request->validated());

        return response()->json([
            'message' => 'Evento atualizado com sucesso.',
            'data' => $event->fresh(),
        ]);
    }

    //DESTROY - Deletar evento (soft delete)
    public function destroy(Request $request, int $id): JsonResponse
    {
        $event = $request->user()
            ->events()
            ->findOrFail($id);

        $event->delete();

        return response()->json([
            'message' => 'Evento removido com sucesso.',
        ]);
    }

    //UPCOMING - Próximos eventos (atalho para o dashboard)
    //EXPLICAÇÃO:
    //  Rota customizada: GET /api/events/upcoming
    //  Retorna os próximos 10 eventos a partir de hoje
    //  Útil para o widget "Próximos Eventos" no dashboard
    public function upcoming(Request $request): JsonResponse
    {
        $limit = $request->integer('limit', 10);

        $events = $request->user()
            ->events()
            ->upcoming()
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $events,
        ]);
    }
}
