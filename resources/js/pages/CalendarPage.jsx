import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    Wallet,
    Calendar as CalendarIcon,
    ListTodo,
    AlertTriangle
} from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const MONTH_NAMES = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

import { normalizeDate, formatDateBR } from '../utils/date';

export default function CalendarPage() {
    const [bills, setBills] = useState([]);
    const [recurringBills, setRecurringBills] = useState([]);
    const [events, setEvents] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [selectedDay, setSelectedDay] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'agenda'

    // Modal para criar evento
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [eventForm, setEventForm] = useState({
        title: '', description: '', start_date: '', end_date: '', all_day: true, priority: 2,
        recurrence_type: 'none', recurrence_interval: '', recurrence_days: [], recurrence_end: '',
    });
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, event: null });
    const [errorNotice, setErrorNotice] = useState(null);

    const activePeriodRef = useRef({ year, month });

    useEffect(() => {
        activePeriodRef.current = { year, month };
    }, [year, month]);

    const fetchData = useCallback(async () => {
        const reqYear = year;
        const reqMonth = month;
        setLoading(true);
        try {
            const [billsRes, eventsRes, recurringRes, incomesRes] = await Promise.all([
                api.get('/monthly-bills', { params: { year: reqYear, month: reqMonth } }),
                api.get('/events'),
                api.get('/recurring-bills'),
                api.get('/incomes', { params: { year: reqYear, month: reqMonth } }),
            ]);
            if (activePeriodRef.current.year !== reqYear || activePeriodRef.current.month !== reqMonth) {
                return;
            }
            setBills(billsRes.data.data);
            setEvents(eventsRes.data.data);
            setRecurringBills(recurringRes.data.data.filter(rb => rb.is_active));
            setIncomes(incomesRes.data.data);
        } catch (err) {
            console.error('Erro:', err);
        } finally {
            if (activePeriodRef.current.year === reqYear && activePeriodRef.current.month === reqMonth) {
                setLoading(false);
            }
        }
    }, [year, month]);

    useEffect(() => {
        fetchData();
        if (window.innerWidth < 640) {
            setViewMode('agenda');
        }
    }, [fetchData]);

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
                const interval = Math.max(1, event.recurrence_type === 'biweekly' ? 2 : (parseInt(event.recurrence_interval) || 1));

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
                    const check = new Date(year, month - 1, dayOfMonth, 12, 0, 0);
                    if (check >= startDate && check <= recEnd) {
                        occurrences.push(dayOfMonth);
                    }
                }
            } else if (event.recurrence_type === 'custom') {
                let d = new Date(startDate);
                const interval = Math.max(1, parseInt(event.recurrence_interval) || 1);
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

        // Dias do mês anterior para completar o início da primeira semana
        const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            days.push({ 
                day: prevMonthLastDay - i, 
                isCurrentMonth: false, 
                isPrevMonth: true,
                bills: [], 
                events: [], 
                virtualBills: [], 
                incomes: [] 
            });
        }

        // Dias do mes
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayBills = bills.filter((b) => normalizeDate(b.due_date) === dateStr);
            const dayIncomes = incomes.filter((i) => normalizeDate(i.expected_date) === dateStr);
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

            days.push({ 
                day: d, 
                date: dateStr, 
                isCurrentMonth: true, 
                bills: dayBills, 
                incomes: dayIncomes, 
                events: allEvents, 
                virtualBills 
            });
        }

        // Completar celulas vazias para fechar a ultima semana com dias do próximo mês e manter 42 células (6 semanas) para consistência visual
        const totalCells = days.length;
        const remainder = totalCells % 7;
        let padCount = remainder > 0 ? 7 - remainder : 0;
        
        if (days.length + padCount < 42) {
            padCount += 42 - (days.length + padCount);
        }

        for (let i = 1; i <= padCount; i++) {
            days.push({ 
                day: i, 
                isCurrentMonth: false, 
                isNextMonth: true,
                bills: [], 
                events: [], 
                virtualBills: [], 
                incomes: [] 
            });
        }

        return days;
    }, [year, month, bills, events, recurringBills, incomes]);

    const agendaItems = useMemo(() => {
        return calendarDays.filter(
            d => d.day && d.isCurrentMonth !== false && (d.bills.length > 0 || d.incomes.length > 0 || d.events.length > 0 || d.virtualBills?.length > 0)
        );
    }, [calendarDays]);

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

    const selectedDayData = calendarDays.find((d) => d.day === selectedDay && d.isCurrentMonth !== false);

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
            start_date: normalizeDate(event.start_date),
            end_date: event.end_date ? normalizeDate(event.end_date) : '',
            all_day: event.all_day,
            priority: event.priority,
            recurrence_type: event.recurrence_type || 'none',
            recurrence_interval: event.recurrence_interval || '',
            recurrence_days: event.recurrence_days || [],
            recurrence_end: event.recurrence_end ? normalizeDate(event.recurrence_end) : '',
        });
        setShowEventModal(true);
    }

    async function handleEventSubmit(e) {
        e.preventDefault();
        try {
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
        } catch (err) {
            console.error('Erro ao salvar evento:', err?.response?.data || err);
        }
    }

    function showError(msg) {
        setErrorNotice(msg);
        setTimeout(() => {
            setErrorNotice(null);
        }, 5000);
    }

    function openDeleteConfirm(event) {
        setDeleteDialog({ isOpen: true, event });
    }

    async function handleConfirmDeleteEvent() {
        const event = deleteDialog.event;
        if (!event) return;
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        try { 
            await api.delete(`/events/${event.id}`); 
            fetchData(); 
            setDeleteDialog({ isOpen: false, event: null });
        } catch (err) { 
            console.error('Erro:', err); 
            showError('Erro ao tentar deletar: ' + (err?.response?.data?.message || err.message));
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    }

    async function handlePayBill(id) {
        try { await api.patch(`/monthly-bills/${id}/pay`); fetchData(); } catch (err) { console.error('Erro:', err); }
    }

    return (
        <AppLayout>
            {/* PageHeader */}
            <div className="mb-6 pb-6 border-b border-[var(--border-primary)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
                            Calendário
                        </h1>
                        <p className="text-sm text-[var(--text-tertiary)] mt-1">
                            Acompanhe os vencimentos de despesas, entradas previstas e compromissos diários.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Seletor de Modo (Grade vs Agenda) - Importante para Mobile */}
                        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-primary)]">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                                    viewMode === 'grid'
                                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                <CalendarIcon size={14} />
                                <span className="hidden sm:inline">Grade</span>
                            </button>
                            <button
                                onClick={() => setViewMode('agenda')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                                    viewMode === 'agenda'
                                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                <ListTodo size={14} />
                                <span className="hidden sm:inline">Agenda</span>
                            </button>
                        </div>

                        {/* Seletor de Mês */}
                        <div className="flex items-center gap-1 bg-[var(--bg-card)] rounded-xl p-1 shadow-sm border border-[var(--border-primary)]">
                            <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Mês anterior">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="min-w-[120px] text-center text-xs font-semibold text-[var(--text-primary)]">
                                {MONTH_NAMES[month]} {year}
                            </span>
                            <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Próximo mês">
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <button 
                            onClick={() => openCreateEvent(selectedDay || new Date().getDate())}
                            className="btn-primary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
                        >
                            <Plus size={16} /> Novo Evento
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--color-primary-200)] border-t-[var(--color-primary-600)]" />
                </div>
            ) : (
                <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Main Content Area */}
                    <div className="flex-1">
                        {viewMode === 'agenda' ? (
                            /* Agenda View (Vertical Timeline) */
                            <div className="space-y-4">
                                {agendaItems.length === 0 ? (
                                    <div className="text-center py-16 bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)] shadow-sm">
                                        <div className="p-3.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] inline-block text-[var(--text-tertiary)] mb-3">
                                            <CalendarDays size={28} />
                                        </div>
                                        <p className="text-sm font-medium text-[var(--text-secondary)]">Nenhum evento ou vencimento neste mês.</p>
                                    </div>
                                ) : (
                                    agendaItems.map((dayData) => (
                                        <div key={dayData.day} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)] p-4 shadow-sm">
                                            <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-2 mb-3">
                                                <h4 className="text-xs font-bold text-[var(--text-primary)]">
                                                    {dayData.day} de {MONTH_NAMES[month]} ({DAY_NAMES[new Date(year, month - 1, dayData.day).getDay()]})
                                                </h4>
                                                <button
                                                    onClick={() => {
                                                        setSelectedDay(dayData.day);
                                                        openCreateEvent(dayData.day);
                                                    }}
                                                    className="text-xs text-[var(--color-primary-600)] hover:underline flex items-center gap-0.5 font-semibold"
                                                >
                                                    <Plus size={12} /> Novo Evento
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {/* Incomes */}
                                                {dayData.incomes.map((income) => (
                                                    <div key={`inc-${income.id}`} className="flex items-center justify-between text-xs py-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-[var(--color-success-500)]" />
                                                            <span className="font-semibold text-[var(--text-primary)]">{income.name}</span>
                                                            <span className="text-[10px] text-[var(--text-tertiary)]">(Renda)</span>
                                                        </div>
                                                        <span className="font-bold text-[var(--color-success-600)] [font-variant-numeric:tabular-nums]">
                                                            +{formatCurrency(income.amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                                
                                                {/* Bills */}
                                                {dayData.bills.map((bill) => (
                                                    <div key={`bill-${bill.id}`} className="flex items-center justify-between text-xs py-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[bill.status]}`} />
                                                            <span className={`font-semibold ${bill.status === 'paid' ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>{bill.name_snapshot}</span>
                                                            <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">
                                                                ({bill.status === 'paid' ? 'Pago' : bill.status === 'overdue' ? 'Atrasado' : 'Pendente'})
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-[var(--text-primary)] [font-variant-numeric:tabular-nums]">
                                                                {formatCurrency(bill.expected_amount)}
                                                            </span>
                                                            {bill.status === 'pending' && (
                                                                <button onClick={() => handlePayBill(bill.id)} className="rounded p-0.5 hover:bg-[var(--bg-hover)] text-[var(--color-success-500)]" title="Marcar como paga">
                                                                    <Clock size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                {/* Virtual Bills */}
                                                {dayData.virtualBills?.map((vb) => (
                                                    <div key={vb.id} className="flex items-center justify-between text-xs py-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-[var(--color-primary-400)]" />
                                                            <span className="font-semibold text-[var(--text-secondary)]">{vb.name_snapshot}</span>
                                                            <span className="text-[10px] text-[var(--text-tertiary)]">(Recorrente Prevista)</span>
                                                        </div>
                                                        <span className="font-bold text-[var(--text-primary)] [font-variant-numeric:tabular-nums]">
                                                            {formatCurrency(vb.expected_amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                                
                                                {/* Events */}
                                                {dayData.events.map((event, eIdx) => (
                                                    <div key={`ev-${event.id}-${eIdx}`} className="flex items-start justify-between text-xs py-1">
                                                        <div className="flex items-start gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-[var(--color-primary-600)] mt-1.5" />
                                                            <div>
                                                                <p className="font-semibold text-[var(--text-primary)]">{event.title}</p>
                                                                {event.description && <p className="text-[10px] text-[var(--text-tertiary)]">{event.description}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => openEditEvent(event)} className="rounded p-0.5 hover:bg-black/5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" title="Editar">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                            </button>
                                                            <button onClick={() => openDeleteConfirm(event)} className="rounded p-0.5 hover:bg-black/5 text-[var(--color-danger-500)]" title="Remover">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            /* Grid View */
                            <div>
                                <div className="rounded-xl border overflow-hidden bg-[var(--bg-card)] shadow-sm border-[var(--border-primary)]">
                                    {/* Day names header */}
                                    <div className="grid grid-cols-7 border-b bg-[var(--bg-secondary)] border-[var(--border-primary)]">
                                        {DAY_NAMES.map((name) => (
                                            <div key={name} className="py-2.5 text-center text-[11px] font-semibold text-[var(--text-tertiary)]">
                                                {name}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Day cells */}
                                    <div className="grid grid-cols-7 bg-[var(--bg-secondary)] gap-[1px]">
                                        {calendarDays.map((dayData, idx) => (
                                            <div
                                                key={idx}
                                                className={`min-h-[60px] sm:min-h-[95px] p-2 transition-all relative flex flex-col justify-between ${
                                                    dayData.isCurrentMonth !== false 
                                                        ? 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]/30 cursor-pointer' 
                                                        : 'bg-[var(--bg-secondary)]/35 cursor-default opacity-40'
                                                }`}
                                                style={{
                                                    boxShadow: dayData.isCurrentMonth !== false && selectedDay === dayData.day ? 'inset 0 0 0 2px var(--color-primary-500)' : undefined,
                                                }}
                                                onClick={() => dayData.isCurrentMonth !== false && setSelectedDay(dayData.day)}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`flex h-5.5 w-5.5 items-center justify-center rounded-full text-xs font-semibold [font-variant-numeric:tabular-nums] transition-colors ${
                                                        dayData.isCurrentMonth !== false && isToday(dayData.day) 
                                                            ? 'bg-[var(--color-primary-500)] text-white' 
                                                            : dayData.isCurrentMonth === false 
                                                                ? 'text-[var(--text-tertiary)]/50' 
                                                                : 'text-[var(--text-secondary)]'
                                                    }`}>
                                                        {dayData.day}
                                                    </span>
                                                </div>
                                                
                                                {/* Compact Indicators Container */}
                                                {dayData.isCurrentMonth !== false && (
                                                    <div className="flex flex-wrap gap-1 mt-1 justify-start">
                                                        {(() => {
                                                            const indicators = [];
                                                            
                                                            // 1. Incomes (Green)
                                                            if (dayData.incomes.length > 0) {
                                                                indicators.push({ key: 'inc', color: 'bg-[var(--color-success-500)]', label: `${dayData.incomes.length} Renda(s)` });
                                                            }
                                                            // 2. Overdue Bills (Red)
                                                            const overdueCount = dayData.bills.filter(b => b.status === 'overdue').length;
                                                            if (overdueCount > 0) {
                                                                indicators.push({ key: 'overdue', color: 'bg-[var(--color-danger-500)]', label: `${overdueCount} Atrasada(s)` });
                                                            }
                                                            // 3. Pending Bills (Amber)
                                                            const pendingCount = dayData.bills.filter(b => b.status === 'pending').length;
                                                            if (pendingCount > 0) {
                                                                indicators.push({ key: 'pending', color: 'bg-[var(--color-warning-500)]', label: `${pendingCount} Pendente(s)` });
                                                            }
                                                            // 4. Paid Bills (Muted Success/Gray)
                                                            const paidCount = dayData.bills.filter(b => b.status === 'paid').length;
                                                            if (paidCount > 0) {
                                                                indicators.push({ key: 'paid', color: 'bg-[var(--text-tertiary)] opacity-60', label: `${paidCount} Paga(s)` });
                                                            }
                                                            // 5. Virtual/Recurring Bills (Light Blue)
                                                            const virtualCount = dayData.virtualBills?.length || 0;
                                                            if (virtualCount > 0) {
                                                                indicators.push({ key: 'virtual', color: 'bg-[var(--color-primary-400)] opacity-80', label: `${virtualCount} Recorrente(s)` });
                                                            }
                                                            // 6. Events (Blue/Purple)
                                                            if (dayData.events.length > 0) {
                                                                indicators.push({ key: 'event', color: 'bg-[var(--color-primary-600)]', label: `${dayData.events.length} Compromisso(s)` });
                                                            }

                                                            return indicators.map((ind, i) => (
                                                                <span key={i} className={`w-1.5 h-1.5 rounded-full ${ind.color}`} title={ind.label} />
                                                            ));
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Clean Legend */}
                                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs p-3.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-secondary)] shadow-sm">
                                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-success-500)]" /> Rendas</span>
                                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-warning-500)]" /> Despesas Pendentes</span>
                                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-danger-500)]" /> Despesas Atrasadas</span>
                                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--text-tertiary)] opacity-60" /> Despesas Pagas</span>
                                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-primary-400)]" /> Recorrentes Previstas</span>
                                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-primary-600)]" /> Compromissos</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Side panel — Day Detail */}
                    <div className="w-full lg:w-[350px]">
                        <div className="sticky top-6 rounded-xl border p-5 bg-[var(--bg-card)] shadow-sm border-[var(--border-primary)]">
                            {selectedDay ? (
                                <>
                                    <div className="mb-5 flex items-center justify-between border-b border-[var(--border-primary)] pb-3">
                                        <div>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary-600)]">Detalhamento do Dia</span>
                                            <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                                                {selectedDay} de {MONTH_NAMES[month]}
                                            </h3>
                                        </div>
                                        <button onClick={() => openCreateEvent(selectedDay)}
                                            className="btn-primary px-3 py-1.5 text-xs font-semibold">
                                            <Plus size={14} /> Novo Evento
                                        </button>
                                    </div>

                                    {/* Bills do dia */}
                                    {selectedDayData?.bills.length > 0 && (
                                        <div className="mb-5">
                                            <p className="mb-2 text-xs font-semibold text-[var(--text-tertiary)] border-b border-[var(--border-primary)] pb-1">Despesas</p>
                                            <div className="space-y-2">
                                                {selectedDayData.bills.map((bill) => (
                                                    <div key={bill.id} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-[var(--bg-secondary)] border-[var(--border-primary)]">
                                                        <div className="min-w-0">
                                                            <p className={`text-xs font-semibold truncate ${bill.status === 'paid' ? 'line-through opacity-60 text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
                                                                {bill.name_snapshot}
                                                            </p>
                                                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: STATUS_COLORS[bill.status] }}>
                                                                {bill.status === 'paid' ? 'Pago' : bill.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-xs font-bold [font-variant-numeric:tabular-nums] text-[var(--text-primary)]">
                                                                {formatCurrency(bill.expected_amount)}
                                                            </span>
                                                            {bill.status === 'pending' && (
                                                                <button onClick={() => handlePayBill(bill.id)} className="rounded p-1 hover:bg-[var(--bg-hover)] text-[var(--color-success-500)]" title="Marcar como paga">
                                                                    <Clock size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Incomes do dia */}
                                    {selectedDayData?.incomes?.length > 0 && (
                                        <div className="mb-5">
                                            <p className="mb-2 text-xs font-semibold text-[var(--text-tertiary)] border-b border-[var(--border-primary)] pb-1">Rendas & Entradas</p>
                                            <div className="space-y-2">
                                                {selectedDayData.incomes.map((income) => (
                                                    <div key={`inc-${income.id}`} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-[var(--bg-secondary)] border-[var(--border-primary)]">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-[var(--color-success-600)] truncate">
                                                                {income.name}
                                                            </p>
                                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                                                                {income.status === 'received' ? 'Recebido' : 'Pendente'}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-bold [font-variant-numeric:tabular-nums] text-[var(--color-success-600)]">
                                                            {formatCurrency(income.amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Contas recorrentes virtuais */}
                                    {selectedDayData?.virtualBills?.length > 0 && (
                                        <div className="mb-5">
                                            <p className="mb-2 text-xs font-semibold text-[var(--text-tertiary)] border-b border-[var(--border-primary)] pb-1">Recorrentes Previstas</p>
                                            <div className="space-y-2">
                                                {selectedDayData.virtualBills.map((vb) => (
                                                    <div key={vb.id} className="flex items-center justify-between rounded-lg border px-3 py-2 border-[var(--color-primary-300)] border-dashed bg-[var(--bg-secondary)] opacity-85">
                                                        <div className="min-w-0 flex items-center gap-1.5">
                                                            <Repeat size={12} className="text-[var(--color-primary-500)]" />
                                                            <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                                                                {vb.name_snapshot}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs font-bold [font-variant-numeric:tabular-nums] text-[var(--text-primary)]">
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
                                            <p className="mb-2 text-xs font-semibold text-[var(--text-tertiary)] border-b border-[var(--border-primary)] pb-1">Compromissos</p>
                                            <div className="space-y-2">
                                                {selectedDayData.events.map((event, eIdx) => (
                                                    <div key={`${event.id}-${eIdx}`} className="rounded-lg border px-3 py-2.5 bg-[var(--bg-secondary)] border-[var(--border-primary)]">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-start gap-1.5 min-w-0 flex-1">
                                                                {event._virtual && <Repeat size={12} className="shrink-0 mt-0.5 text-[var(--color-primary-400)]" />}
                                                                <p className="text-xs font-semibold text-[var(--text-primary)] break-all sm:break-words whitespace-pre-wrap leading-tight">{event.title}</p>
                                                            </div>
                                                            <div className="flex gap-1 shrink-0">
                                                                <button onClick={() => openEditEvent(event)} className="rounded p-0.5 hover:bg-black/5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" title="Editar Evento">
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                                </button>
                                                                <button onClick={() => openDeleteConfirm(event)} className="rounded p-0.5 hover:bg-black/5 text-[var(--color-danger-500)]" title="Remover Evento">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {event.description && (
                                                            <p className="mt-1 text-[11px] text-[var(--text-tertiary)] break-all sm:break-words whitespace-pre-wrap">{event.description}</p>
                                                        )}
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className="inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                                                style={{ backgroundColor: `color-mix(in srgb, ${PRIORITY_COLORS[event.priority]} 12%, transparent)`, color: PRIORITY_COLORS[event.priority] }}>
                                                                {event.priority === 1 ? 'Alta' : event.priority === 3 ? 'Baixa' : 'Média'}
                                                            </span>
                                                            {event._virtual && (
                                                                <span className="text-[9px] font-semibold uppercase text-[var(--color-primary-500)]">Recorrente</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedDayData?.bills.length === 0 && (selectedDayData?.incomes?.length || 0) === 0 && (selectedDayData?.virtualBills?.length || 0) === 0 && selectedDayData?.events.length === 0 && (
                                        <p className="py-12 text-center text-xs italic font-medium text-[var(--text-tertiary)]">
                                            Nada agendado para este dia.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="py-16 text-center">
                                    <div className="p-3.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] inline-block text-[var(--text-tertiary)] mb-3">
                                        <CalendarDays size={28} />
                                    </div>
                                    <p className="text-xs font-medium text-[var(--text-tertiary)]">
                                        Clique em um dia do planejador para ver seus vencimentos e compromissos diários.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Event Modal */}
            {showEventModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && setShowEventModal(false)}>
                    <div className="w-full max-w-md rounded-xl border p-6 shadow-lg relative bg-[var(--bg-card)] border-[var(--border-primary)] animate-scale-in" style={{ boxShadow: 'var(--shadow-lg)' }}>
                        
                        <div className="mb-4">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary-600)]">Compromisso</span>
                            <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)] font-heading mt-0.5">{editingEvent ? 'Editar Evento' : 'Novo Evento'}</h3>
                        </div>

                        <form onSubmit={handleEventSubmit} className="space-y-4">
                            <Field label="Título do Evento" value={eventForm.title} onChange={(v) => setEventForm({ ...eventForm, title: v })} required />
                            <Field label="Descrição / Anotação" value={eventForm.description} onChange={(v) => setEventForm({ ...eventForm, description: v })} />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Data Início" type="date" value={eventForm.start_date} onChange={(v) => setEventForm({ ...eventForm, start_date: v })} required />
                                <Field label="Data Fim (Opcional)" type="date" value={eventForm.end_date} onChange={(v) => setEventForm({ ...eventForm, end_date: v })} />
                            </div>
                            
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Nível de Prioridade</label>
                                <div className="flex gap-2 p-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                                    {[{ p: 1, l: 'Alta' }, { p: 2, l: 'Normal' }, { p: 3, l: 'Baixa' }].map(({ p, l }) => (
                                        <button key={p} type="button" onClick={() => setEventForm({ ...eventForm, priority: p })}
                                            className="flex-1 rounded-md py-1.5 text-xs font-semibold border transition-all active:scale-95 hover:opacity-90"
                                            style={{
                                                backgroundColor: eventForm.priority === p ? `color-mix(in srgb, ${PRIORITY_COLORS[p]} 12%, transparent)` : 'transparent',
                                                color: eventForm.priority === p ? PRIORITY_COLORS[p] : 'var(--text-tertiary)',
                                                borderColor: eventForm.priority === p ? PRIORITY_COLORS[p] : 'transparent',
                                            }}>
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recorrencia */}
                            <div className="rounded-lg border p-3.5 bg-[var(--bg-secondary)] border-[var(--border-primary)]">
                                <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                                    <Repeat size={12} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
                                    Recorrência
                                </label>
                                <select value={eventForm.recurrence_type} onChange={(e) => setEventForm({ ...eventForm, recurrence_type: e.target.value })}
                                    className="focus-ring w-full rounded-xl border px-3 py-2 text-xs outline-none font-semibold transition-all duration-300"
                                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <option value="none">Não se repete</option>
                                    <option value="daily">Diariamente</option>
                                    <option value="weekly">Semanalmente</option>
                                    <option value="biweekly">Quinzenalmente</option>
                                    <option value="monthly">Mensalmente</option>
                                    <option value="custom">A cada x dias</option>
                                </select>

                                {eventForm.recurrence_type === 'custom' && (
                                    <div className="mt-3">
                                        <Field label="Intervalo (dias)" type="number" value={eventForm.recurrence_interval}
                                            onChange={(v) => setEventForm({ ...eventForm, recurrence_interval: v })} required />
                                    </div>
                                )}

                                {eventForm.recurrence_type !== 'none' && (
                                    <div className="mt-3">
                                        <Field label="Data Limite da Repetição" type="date" value={eventForm.recurrence_end}
                                            onChange={(v) => setEventForm({ ...eventForm, recurrence_end: v })} />
                                    </div>
                                )}

                                {eventForm.recurrence_type === 'weekly' && (
                                    <div className="mt-3">
                                        <label className="mb-1.5 block text-[10px] font-semibold text-[var(--text-tertiary)]">Dias Selecionados</label>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((letter, idx) => {
                                                const selected = eventForm.recurrence_days.includes(idx);
                                                return (
                                                    <button key={idx} type="button"
                                                        onClick={() => {
                                                            const days = selected
                                                                ? eventForm.recurrence_days.filter(d => d !== idx)
                                                                : [...eventForm.recurrence_days, idx];
                                                            setEventForm({ ...eventForm, recurrence_days: days });
                                                        }}
                                                        className="flex h-7.5 w-7.5 items-center justify-center rounded-full text-xs font-semibold border transition-all active:scale-95"
                                                        style={{
                                                            backgroundColor: selected ? 'var(--color-primary-600)' : 'var(--bg-card)',
                                                            color: selected ? 'white' : 'var(--text-secondary)',
                                                            borderColor: selected ? 'var(--color-primary-600)' : 'var(--border-primary)',
                                                        }}>
                                                        {letter}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-dashed border-[var(--border-primary)]">
                                <button type="button" onClick={() => setShowEventModal(false)} className="rounded-lg px-4 py-2.5 text-xs font-semibold hover:bg-[var(--bg-hover)] transition-colors" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                                <button type="submit" className="btn-primary px-4 py-2.5 text-xs font-semibold">{editingEvent ? 'Confirmar Ajustes' : 'Criar Evento'}</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, event: null })}
                title="Excluir Evento"
                description={
                    deleteDialog.event?.recurrence_type && deleteDialog.event.recurrence_type !== 'none'
                        ? `Deseja mesmo remover TODAS as ocorrências do evento recorrente "${deleteDialog.event.title}"?`
                        : `Deseja mesmo remover o evento "${deleteDialog.event?.title}"? Esta ação não pode ser desfeita.`
                }
                variant={deleteDialog.event?.recurrence_type && deleteDialog.event.recurrence_type !== 'none' ? 'warning' : 'danger'}
                confirmLabel="Remover"
                onConfirm={handleConfirmDeleteEvent}
            />

            {errorNotice && (
                <div className="fixed bottom-5 right-5 z-[250] max-w-sm rounded-xl border border-[var(--color-danger-500)]/20 bg-[var(--bg-card)] p-4 shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="p-1 rounded bg-[var(--color-danger-50)] dark:bg-[var(--color-danger-500)]/10 text-[var(--color-danger-600)] shrink-0">
                        <AlertTriangle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)]">Erro</p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-normal">{errorNotice}</p>
                    </div>
                    <button onClick={() => setErrorNotice(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                        <X size={14} />
                    </button>
                </div>
            )}
        </AppLayout>
    );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
                className="input-base text-xs font-medium" />
        </div>
    );
}
