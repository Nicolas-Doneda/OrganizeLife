import { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
    Receipt,
    CalendarDays,
    Clock,
    Trash2,
    Repeat,
} from 'lucide-react';

const MONTH_NAMES = [
    '', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const STATUS_COLORS = {
    pending: 'var(--color-warning-600)',
    paid: 'var(--color-success-600)',
    overdue: 'var(--color-danger-600)',
    canceled: 'var(--text-tertiary)',
};

const PRIORITY_COLORS = {
    1: 'var(--color-danger-600)',
    2: 'var(--color-primary-600)',
    3: 'var(--color-success-600)',
};

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

// Helper: extrai 'YYYY-MM-DD' de qualquer formato de data (ISO, datetime, etc)
function normalizeDate(dateStr) {
    if (!dateStr) return '';
    return String(dateStr).substring(0, 10);
}

function formatDateBR(dateStr) {
    const d = normalizeDate(dateStr);
    if (!d || d.length < 10) return '';
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
}

export default function CalendarPage() {
    const [bills, setBills] = useState([]);
    const [recurringBills, setRecurringBills] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [selectedDay, setSelectedDay] = useState(null);

    // Modal para criar evento
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [eventForm, setEventForm] = useState({
        title: '', description: '', start_date: '', end_date: '', all_day: true, priority: 2,
        recurrence_type: 'none', recurrence_interval: '', recurrence_days: [], recurrence_end: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [billsRes, eventsRes, recurringRes] = await Promise.all([
                api.get('/monthly-bills', { params: { year, month } }),
                api.get('/events'),
                api.get('/recurring-bills'),
            ]);
            setBills(billsRes.data.data);
            setEvents(eventsRes.data.data);
            setRecurringBills(recurringRes.data.data.filter(rb => rb.is_active));
        } catch { /* */ } finally { setLoading(false); }
    }, [year, month]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Gerar dias do calendario
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const startDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        // IDs de recurring_bills que ja tem monthly_bill neste mes
        const coveredRecurringIds = new Set(bills.filter(b => b.recurring_bill_id).map(b => b.recurring_bill_id));

        // Gerar ocorrencias virtuais de eventos recorrentes
        function getRecurringEventOccurrences(event) {
            if (!event.recurrence_type || event.recurrence_type === 'none') return [];
            const occurrences = [];
            const startDate = new Date(normalizeDate(event.start_date) + 'T12:00:00');

            let recEnd;
            if (event.recurrence_end) {
                recEnd = new Date(normalizeDate(event.recurrence_end) + 'T23:59:59');
            } else {
                recEnd = new Date(year + 5, month, 0);
                recEnd.setHours(23, 59, 59, 999);
            }

            const monthStart = new Date(year, month - 1, 1);
            monthStart.setHours(0, 0, 0, 0);

            const monthEnd = new Date(year, month, 0);
            monthEnd.setHours(23, 59, 59, 999);

            if (event.recurrence_type === 'daily') {
                let d = new Date(startDate);
                if (d < monthStart) d = new Date(monthStart);
                while (d <= monthEnd && d <= recEnd) {
                    if (d >= startDate) occurrences.push(d.getDate());
                    d.setDate(d.getDate() + 1);
                }
            } else if (event.recurrence_type === 'weekly' || event.recurrence_type === 'biweekly') {
                const interval = event.recurrence_type === 'biweekly' ? 2 : (parseInt(event.recurrence_interval) || 1);

                let weekStart = new Date(startDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Domingo da semana que contem start_date

                while (weekStart <= monthEnd && weekStart <= recEnd) {
                    for (let i = 0; i < 7; i++) {
                        let current = new Date(weekStart);
                        current.setDate(weekStart.getDate() + i);

                        if (current >= startDate && current <= monthEnd && current <= recEnd) {
                            if (current.getMonth() === month - 1) {
                                // Se o usuario escolheu dias da semana especificos
                                if (event.recurrence_days && event.recurrence_days.length > 0) {
                                    if (event.recurrence_days.includes(current.getDay())) {
                                        occurrences.push(current.getDate());
                                    }
                                } else {
                                    // Comportamento fallback: repete no mesmo dia da semana do evento original
                                    if (current.getDay() === startDate.getDay()) {
                                        occurrences.push(current.getDate());
                                    }
                                }
                            }
                        }
                    }
                    weekStart.setDate(weekStart.getDate() + (interval * 7));
                }
            } else if (event.recurrence_type === 'monthly') {
                const dayOfMonth = startDate.getDate();
                if (dayOfMonth <= daysInMonth) {
                    const check = new Date(year, month - 1, dayOfMonth);
                    if (check >= startDate && check <= recEnd) {
                        occurrences.push(dayOfMonth);
                    }
                }
            } else if (event.recurrence_type === 'custom') {
                let d = new Date(startDate);
                const interval = parseInt(event.recurrence_interval) || 1;
                if (d < monthStart) {
                    const diffTime = Math.abs(monthStart - d);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const jumps = Math.ceil(diffDays / interval);
                    d.setDate(d.getDate() + (jumps * interval));
                }

                while (d <= monthEnd && d <= recEnd) {
                    if (d >= monthStart && d >= startDate && d.getMonth() === month - 1) {
                        occurrences.push(d.getDate());
                    }
                    d.setDate(d.getDate() + interval);
                }
            }
            return occurrences;
        }

        // Pre-compute recurring event occurrences
        const recurringEventMap = {}; // day -> [events]
        events.forEach(event => {
            if (event.recurrence_type && event.recurrence_type !== 'none') {
                const days = getRecurringEventOccurrences(event);
                days.forEach(day => {
                    if (!recurringEventMap[day]) recurringEventMap[day] = [];
                    recurringEventMap[day].push({ ...event, _virtual: true });
                });
            }
        });

        const days = [];

        // Dias vazios antes do primeiro dia
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ day: null, bills: [], events: [], virtualBills: [] });
        }

        // Dias do mes
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayBills = bills.filter((b) => normalizeDate(b.due_date) === dateStr);
            const dayEvents = events.filter((e) => {
                // Eventos nao recorrentes: match por data
                if (e.recurrence_type && e.recurrence_type !== 'none') return false;
                const start = normalizeDate(e.start_date);
                const end = normalizeDate(e.end_date) || start;
                return dateStr >= start && dateStr <= end;
            });

            // Adicionar ocorrencias virtuais de eventos recorrentes
            const virtualEvents = recurringEventMap[d] || [];
            const allEvents = [...dayEvents, ...virtualEvents];

            // Pills virtuais de contas recorrentes (que nao tem monthly_bill ainda)
            const virtualBills = recurringBills
                .filter(rb => !coveredRecurringIds.has(rb.id) && rb.due_day === d)
                .map(rb => ({
                    id: `virtual-${rb.id}`,
                    name_snapshot: rb.name,
                    expected_amount: rb.expected_amount,
                    status: 'pending',
                    _virtual: true,
                    _recurring: true,
                }));

            days.push({ day: d, date: dateStr, bills: dayBills, events: allEvents, virtualBills });
        }

        return days;
    }, [year, month, bills, events, recurringBills]);

    function prevMonth() {
        if (month === 1) { setMonth(12); setYear(year - 1); } else { setMonth(month - 1); }
        setSelectedDay(null);
    }

    function nextMonth() {
        if (month === 12) { setMonth(1); setYear(year + 1); } else { setMonth(month + 1); }
        setSelectedDay(null);
    }

    const today = new Date();
    const isToday = (day) => day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

    const selectedDayData = calendarDays.find((d) => d.day === selectedDay);

    function openCreateEvent(day) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setEditingEvent(null);
        setEventForm({ title: '', description: '', start_date: dateStr, end_date: '', all_day: true, priority: 2, recurrence_type: 'none', recurrence_interval: '', recurrence_days: [], recurrence_end: '' });
        setShowEventModal(true);
    }

    function openEditEvent(event) {
        setEditingEvent(event);
        setEventForm({
            title: event.title,
            description: event.description || '',
            start_date: event.start_date,
            end_date: event.end_date || '',
            all_day: event.all_day,
            priority: event.priority,
            recurrence_type: event.recurrence_type || 'none',
            recurrence_interval: event.recurrence_interval || '',
            recurrence_days: event.recurrence_days || [],
            recurrence_end: event.recurrence_end || '',
        });
        setShowEventModal(true);
    }

    async function handleEventSubmit(e) {
        e.preventDefault();
        try {
            // Garante que o intervalo de recorrencia seja valido, por ex, para daily vai como 1 implicitamente
            let parsedInterval = null;
            if (eventForm.recurrence_type === 'custom') parsedInterval = parseInt(eventForm.recurrence_interval) || 1;
            else if (eventForm.recurrence_type !== 'none') parsedInterval = 1;

            const data = {
                ...eventForm,
                end_date: eventForm.end_date || null,
                priority: parseInt(eventForm.priority),
                recurrence_interval: parsedInterval,
                recurrence_days: eventForm.recurrence_days.length > 0 ? eventForm.recurrence_days : null,
                recurrence_end: eventForm.recurrence_end || null,
            };
            if (editingEvent) { await api.put(`/events/${editingEvent.id}`, data); }
            else { await api.post('/events', data); }
            setShowEventModal(false);
            fetchData();
        } catch { /* */ }
    }

    async function handleDeleteEvent(event) {
        const msg = event.recurrence_type && event.recurrence_type !== 'none'
            ? 'Este é um evento recorrente. Deseja remover TODAS as ocorrências dele?'
            : 'Remover este evento?';
        if (!confirm(msg)) return;
        try { await api.delete(`/events/${event.id}`); fetchData(); } catch { /* */ }
    }

    async function handlePayBill(id) {
        try { await api.patch(`/monthly-bills/${id}/pay`); fetchData(); } catch { /* */ }
    }

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Calendario</h1>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Suas contas e eventos em um so lugar</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                        <ChevronLeft size={18} />
                    </button>
                    <span className="min-w-[150px] text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {MONTH_NAMES[month]} {year}
                    </span>
                    <button onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
                </div>
            ) : (
                <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Calendar Grid */}
                    <div className="flex-1">
                        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            {/* Day names header */}
                            <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                                {DAY_NAMES.map((name) => (
                                    <div key={name} className="py-2.5 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>
                                        {name}
                                    </div>
                                ))}
                            </div>

                            {/* Day cells */}
                            <div className="grid grid-cols-7">
                                {calendarDays.map((dayData, idx) => (
                                    <div
                                        key={idx}
                                        className={`min-h-[90px] border-b border-r p-1.5 cursor-pointer transition-colors ${dayData.day ? 'hover:bg-black/[0.02]' : ''}`}
                                        style={{
                                            borderColor: 'var(--border-primary)',
                                            backgroundColor: selectedDay === dayData.day && dayData.day ? 'var(--bg-active)' : 'transparent',
                                        }}
                                        onClick={() => dayData.day && setSelectedDay(dayData.day)}
                                    >
                                        {dayData.day && (
                                            <>
                                                <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${isToday(dayData.day) ? 'bg-primary-600 text-white' : ''}`}
                                                    style={!isToday(dayData.day) ? { color: 'var(--text-primary)' } : {}}>
                                                    {dayData.day}
                                                </div>
                                                <div className="space-y-0.5">
                                                    {dayData.bills.slice(0, 2).map((bill) => (
                                                        <div key={`b-${bill.id}`} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium truncate"
                                                            style={{ backgroundColor: STATUS_COLORS[bill.status] + '20', color: STATUS_COLORS[bill.status] }}>
                                                            <Receipt size={8} className="shrink-0" />
                                                            <span className="truncate">{bill.name_snapshot}</span>
                                                        </div>
                                                    ))}
                                                    {dayData.virtualBills?.slice(0, 1).map((vb) => (
                                                        <div key={vb.id} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium truncate"
                                                            style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
                                                            <Repeat size={8} className="shrink-0" />
                                                            <span className="truncate">{vb.name_snapshot}</span>
                                                        </div>
                                                    ))}
                                                    {dayData.events.slice(0, 2).map((event, eIdx) => (
                                                        <div key={`e-${event.id}-${eIdx}`} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium truncate"
                                                            style={{ backgroundColor: PRIORITY_COLORS[event.priority] + '20', color: PRIORITY_COLORS[event.priority] }}>
                                                            {event._virtual ? <Repeat size={8} className="shrink-0" /> : <CalendarDays size={8} className="shrink-0" />}
                                                            <span className="truncate">{event.title}</span>
                                                        </div>
                                                    ))}
                                                    {(dayData.bills.length + (dayData.virtualBills?.length || 0) + dayData.events.length > 4) && (
                                                        <p className="text-[9px] text-center" style={{ color: 'var(--text-tertiary)' }}>
                                                            +{dayData.bills.length + (dayData.virtualBills?.length || 0) + dayData.events.length - 4} mais
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legenda */}
                        <div className="mt-3 flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-warning-600)' }} /> Pendente</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-success-600)' }} /> Pago</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-danger-600)' }} /> Atrasado</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-primary-600)' }} /> Evento</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-primary-400)' }} /> Recorrente</span>
                        </div>
                    </div>

                    {/* Side panel — Day Detail */}
                    <div className="w-full lg:w-[320px]">
                        <div className="sticky top-6 rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            {selectedDay ? (
                                <>
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {selectedDay} de {MONTH_NAMES[month]}
                                        </h3>
                                        <button onClick={() => openCreateEvent(selectedDay)}
                                            className="flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-700">
                                            <Plus size={12} /> Evento
                                        </button>
                                    </div>

                                    {/* Bills do dia */}
                                    {selectedDayData?.bills.length > 0 && (
                                        <div className="mb-4">
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Contas</p>
                                            <div className="space-y-2">
                                                {selectedDayData.bills.map((bill) => (
                                                    <div key={bill.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                                                        style={{ borderColor: 'var(--border-primary)' }}>
                                                        <div className="min-w-0">
                                                            <p className={`text-sm font-medium truncate ${bill.status === 'paid' ? 'line-through' : ''}`}
                                                                style={{ color: 'var(--text-primary)' }}>
                                                                {bill.name_snapshot}
                                                            </p>
                                                            <p className="text-xs" style={{ color: STATUS_COLORS[bill.status] }}>
                                                                {bill.status === 'paid' ? 'Pago' : bill.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                                                {formatCurrency(bill.expected_amount)}
                                                            </span>
                                                            {bill.status === 'pending' && (
                                                                <button onClick={() => handlePayBill(bill.id)} className="rounded-lg p-1 hover:bg-black/5"
                                                                    style={{ color: 'var(--color-success-500)' }} title="Marcar como paga">
                                                                    <Clock size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Contas recorrentes virtuais */}
                                    {selectedDayData?.virtualBills?.length > 0 && (
                                        <div className="mb-4">
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Recorrentes (previstas)</p>
                                            <div className="space-y-2">
                                                {selectedDayData.virtualBills.map((vb) => (
                                                    <div key={vb.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5 opacity-70"
                                                        style={{ borderColor: 'var(--color-primary-300)', borderStyle: 'dashed' }}>
                                                        <div className="min-w-0 flex items-center gap-2">
                                                            <Repeat size={14} style={{ color: 'var(--color-primary-500)' }} />
                                                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                                                {vb.name_snapshot}
                                                            </p>
                                                        </div>
                                                        <span className="text-sm font-bold shrink-0" style={{ color: 'var(--text-primary)' }}>
                                                            {formatCurrency(vb.expected_amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Eventos do dia */}
                                    {selectedDayData?.events.length > 0 && (
                                        <div>
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Eventos</p>
                                            <div className="space-y-2">
                                                {selectedDayData.events.map((event, eIdx) => (
                                                    <div key={`${event.id}-${eIdx}`} className="rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--border-primary)' }}>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-start gap-2 min-w-0 flex-1">
                                                                {event._virtual && <Repeat size={14} className="shrink-0 mt-[3px]" style={{ color: 'var(--color-primary-400)' }} />}
                                                                <p className="text-sm font-medium break-all sm:break-words whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{event.title}</p>
                                                            </div>
                                                            <div className="flex gap-1 shrink-0">
                                                                <button onClick={() => openEditEvent(event)} className="rounded p-1 hover:bg-black/5" style={{ color: 'var(--text-tertiary)' }} title="Editar Evento">
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                                </button>
                                                                <button onClick={() => handleDeleteEvent(event)} className="rounded p-1 hover:bg-black/5" style={{ color: 'var(--color-danger-500)' }} title="Remover Evento">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {event.description && (
                                                            <p className="mt-1 text-xs break-all sm:break-words whitespace-pre-wrap" style={{ color: 'var(--text-tertiary)' }}>{event.description}</p>
                                                        )}
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                                                                style={{ backgroundColor: PRIORITY_COLORS[event.priority] + '20', color: PRIORITY_COLORS[event.priority] }}>
                                                                {event.priority === 1 ? 'Alta' : event.priority === 3 ? 'Baixa' : 'Normal'}
                                                            </span>
                                                            {event._virtual && (
                                                                <span className="text-[10px] font-medium" style={{ color: 'var(--color-primary-400)' }}>Recorrente</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedDayData?.bills.length === 0 && (selectedDayData?.virtualBills?.length || 0) === 0 && selectedDayData?.events.length === 0 && (
                                        <p className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                            Nada agendado para este dia
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="py-12 text-center">
                                    <CalendarDays size={32} style={{ color: 'var(--text-tertiary)' }} className="mx-auto mb-2" />
                                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                        Clique em um dia para ver detalhes
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Event Modal */}
            {showEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && setShowEventModal(false)}>
                    <div className="w-full max-w-md rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <h3 className="mb-4 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</h3>
                        <form onSubmit={handleEventSubmit} className="space-y-4">
                            <Field label="Titulo" value={eventForm.title} onChange={(v) => setEventForm({ ...eventForm, title: v })} required />
                            <Field label="Descricao" value={eventForm.description} onChange={(v) => setEventForm({ ...eventForm, description: v })} />
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Inicio" type="date" value={eventForm.start_date} onChange={(v) => setEventForm({ ...eventForm, start_date: v })} required />
                                <Field label="Fim (opcional)" type="date" value={eventForm.end_date} onChange={(v) => setEventForm({ ...eventForm, end_date: v })} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Prioridade</label>
                                <div className="flex gap-2">
                                    {[{ p: 1, l: 'Alta' }, { p: 2, l: 'Normal' }, { p: 3, l: 'Baixa' }].map(({ p, l }) => (
                                        <button key={p} type="button" onClick={() => setEventForm({ ...eventForm, priority: p })}
                                            className="flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-colors"
                                            style={{
                                                backgroundColor: eventForm.priority === p ? PRIORITY_COLORS[p] + '15' : 'transparent',
                                                color: eventForm.priority === p ? PRIORITY_COLORS[p] : 'var(--text-tertiary)',
                                                borderColor: eventForm.priority === p ? PRIORITY_COLORS[p] : 'var(--border-primary)',
                                            }}>
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recorrencia */}
                            <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-primary)' }}>
                                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    <Repeat size={14} className="inline mr-1" style={{ verticalAlign: '-2px' }} />
                                    Recorrencia
                                </label>
                                <select value={eventForm.recurrence_type} onChange={(e) => setEventForm({ ...eventForm, recurrence_type: e.target.value })}
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <option value="none">Nao repete</option>
                                    <option value="daily">Diariamente</option>
                                    <option value="weekly">Semanalmente</option>
                                    <option value="biweekly">Quinzenalmente</option>
                                    <option value="monthly">Mensalmente</option>
                                    <option value="custom">A cada x dias</option>
                                </select>

                                {eventForm.recurrence_type === 'custom' && (
                                    <div className="mt-3">
                                        <Field label="A cada quantos dias?" type="number" value={eventForm.recurrence_interval}
                                            onChange={(v) => setEventForm({ ...eventForm, recurrence_interval: v })} required />
                                    </div>
                                )}

                                {eventForm.recurrence_type !== 'none' && (
                                    <div className="mt-3">
                                        <Field label="Repetir ate (opcional)" type="date" value={eventForm.recurrence_end}
                                            onChange={(v) => setEventForm({ ...eventForm, recurrence_end: v })} />
                                    </div>
                                )}

                                {eventForm.recurrence_type === 'weekly' && (
                                    <div className="mt-3">
                                        <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Dias da semana</label>
                                        <div className="flex gap-1">
                                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((name, idx) => {
                                                const selected = eventForm.recurrence_days.includes(idx);
                                                return (
                                                    <button key={idx} type="button"
                                                        onClick={() => {
                                                            const days = selected
                                                                ? eventForm.recurrence_days.filter(d => d !== idx)
                                                                : [...eventForm.recurrence_days, idx];
                                                            setEventForm({ ...eventForm, recurrence_days: days });
                                                        }}
                                                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium border transition-colors"
                                                        style={{
                                                            backgroundColor: selected ? 'var(--color-primary-600)' : 'transparent',
                                                            color: selected ? 'white' : 'var(--text-tertiary)',
                                                            borderColor: selected ? 'var(--color-primary-600)' : 'var(--border-primary)',
                                                        }}>
                                                        {name.charAt(0)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowEventModal(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                                <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">{editingEvent ? 'Salvar' : 'Criar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
                className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
        </div>
    );
}
