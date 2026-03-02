import { useState, useEffect } from 'react';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import { Plus, CalendarDays, Trash2, Pencil, Clock, MapPin } from 'lucide-react';

const PRIORITY_CONFIG = {
    1: { label: 'Alta', color: 'var(--color-danger-600)', bg: 'var(--color-danger-50)' },
    2: { label: 'Normal', color: 'var(--color-primary-600)', bg: 'var(--color-primary-50)' },
    3: { label: 'Baixa', color: 'var(--color-success-600)', bg: 'var(--color-success-50)' },
};

export default function EventsPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', all_day: true, priority: 2, reminder_at: '' });

    useEffect(() => { fetchEvents(); }, []);

    async function fetchEvents() {
        setLoading(true);
        try { const res = await api.get('/events'); setEvents(res.data.data); }
        catch { /* */ } finally { setLoading(false); }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const data = { ...form, end_date: form.end_date || null, reminder_at: form.reminder_at || null, priority: parseInt(form.priority) };
            if (editing) { await api.put(`/events/${editing.id}`, data); }
            else { await api.post('/events', data); }
            setShowModal(false); setEditing(null);
            setForm({ title: '', description: '', start_date: '', end_date: '', all_day: true, priority: 2, reminder_at: '' });
            fetchEvents();
        } catch { /* */ }
    }

    async function handleDelete(event) {
        if (!confirm(`Remover o evento "${event.title}"?`)) return;
        try { await api.delete(`/events/${event.id}`); fetchEvents(); } catch { /* */ }
    }

    function openCreate() {
        setEditing(null);
        setForm({ title: '', description: '', start_date: new Date().toISOString().split('T')[0], end_date: '', all_day: true, priority: 2, reminder_at: '' });
        setShowModal(true);
    }

    function openEdit(event) {
        setEditing(event);
        setForm({ title: event.title, description: event.description || '', start_date: event.start_date, end_date: event.end_date || '', all_day: event.all_day, priority: event.priority, reminder_at: event.reminder_at || '' });
        setShowModal(true);
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function isPast(dateStr) {
        return new Date(dateStr) < new Date(new Date().toDateString());
    }

    // Separar eventos futuros e passados
    const upcoming = events.filter((e) => !isPast(e.start_date)).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    const past = events.filter((e) => isPast(e.start_date)).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

    return (
        <AppLayout>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Eventos</h1>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Datas importantes e lembretes</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
                    <Plus size={18} /> Novo Evento
                </button>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
                </div>
            ) : events.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <CalendarDays size={32} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>Nenhum evento criado</p>
                </div>
            ) : (
                <>
                    {/* Proximos */}
                    {upcoming.length > 0 && (
                        <div className="mb-6">
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Proximos</h2>
                            <div className="space-y-2">
                                {upcoming.map((event) => (
                                    <EventCard key={event.id} event={event} onEdit={() => openEdit(event)} onDelete={() => handleDelete(event)} formatDate={formatDate} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Passados */}
                    {past.length > 0 && (
                        <div>
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Passados</h2>
                            <div className="space-y-2 opacity-60">
                                {past.map((event) => (
                                    <EventCard key={event.id} event={event} onEdit={() => openEdit(event)} onDelete={() => handleDelete(event)} formatDate={formatDate} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <h3 className="mb-4 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{editing ? 'Editar Evento' : 'Novo Evento'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Field label="Titulo" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
                            <Field label="Descricao" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Inicio" type="date" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} required />
                                <Field label="Fim (opcional)" type="date" value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Prioridade</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map((p) => (
                                        <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                                            className="flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-colors"
                                            style={{
                                                backgroundColor: form.priority === p ? PRIORITY_CONFIG[p].bg : 'transparent',
                                                color: form.priority === p ? PRIORITY_CONFIG[p].color : 'var(--text-tertiary)',
                                                borderColor: form.priority === p ? PRIORITY_CONFIG[p].color : 'var(--border-primary)',
                                            }}>
                                            {PRIORITY_CONFIG[p].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                                <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">{editing ? 'Salvar' : 'Criar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function EventCard({ event, onEdit, onDelete, formatDate }) {
    const priority = PRIORITY_CONFIG[event.priority] || PRIORITY_CONFIG[2];
    return (
        <div className="flex items-center gap-4 rounded-xl border px-5 py-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg" style={{ backgroundColor: priority.bg, color: priority.color }}>
                <span className="text-xs font-bold leading-none">{new Date(event.start_date).getDate()}</span>
                <span className="text-[10px] uppercase leading-none mt-0.5">{new Date(event.start_date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{event.title}</p>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>{formatDate(event.start_date)}</span>
                    {event.end_date && <><span>→</span><span>{formatDate(event.end_date)}</span></>}
                </div>
            </div>
            <span className="hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline-block" style={{ backgroundColor: priority.bg, color: priority.color }}>{priority.label}</span>
            <div className="flex gap-1">
                <button onClick={onEdit} className="rounded-lg p-1.5" style={{ color: 'var(--text-tertiary)' }}><Pencil size={14} /></button>
                <button onClick={onDelete} className="rounded-lg p-1.5" style={{ color: 'var(--color-danger-500)' }}><Trash2 size={14} /></button>
            </div>
        </div>
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
