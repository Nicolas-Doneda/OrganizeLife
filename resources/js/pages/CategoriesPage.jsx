import { useState, useEffect } from 'react';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import { Plus, Tag, Trash2, Pencil } from 'lucide-react';

const COLORS = [
    { name: 'gray', hex: '#6b7280' }, { name: 'red', hex: '#ef4444' },
    { name: 'orange', hex: '#f97316' }, { name: 'yellow', hex: '#eab308' },
    { name: 'green', hex: '#22c55e' }, { name: 'teal', hex: '#14b8a6' },
    { name: 'blue', hex: '#3b82f6' }, { name: 'indigo', hex: '#6366f1' },
    { name: 'purple', hex: '#a855f7' }, { name: 'pink', hex: '#ec4899' },
];

function getColorHex(name) {
    return COLORS.find((c) => c.name === name)?.hex || '#6b7280';
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', color: 'blue', icon: '' });

    useEffect(() => { fetch(); }, []);

    async function fetch() {
        setLoading(true);
        try { const res = await api.get('/categories'); setCategories(res.data.data); }
        catch { /* */ } finally { setLoading(false); }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            if (editing) { await api.put(`/categories/${editing.id}`, form); }
            else { await api.post('/categories', form); }
            setShowModal(false); setEditing(null); setForm({ name: '', color: 'blue', icon: '' }); fetch();
        } catch { /* */ }
    }

    async function handleDelete(cat) {
        if (!confirm(`Remover a categoria "${cat.name}"?`)) return;
        try { await api.delete(`/categories/${cat.id}`); fetch(); } catch { /* */ }
    }

    return (
        <AppLayout>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Categorias</h1>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Organize suas contas por categoria</p>
                </div>
                <button onClick={() => { setEditing(null); setForm({ name: '', color: 'blue', icon: '' }); setShowModal(true); }}
                    className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
                    <Plus size={18} /> Nova Categoria
                </button>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
                </div>
            ) : categories.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <Tag size={32} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>Nenhuma categoria criada</p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categories.map((cat) => (
                        <div key={cat.id} className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
                            <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: getColorHex(cat.color) + '20', color: getColorHex(cat.color) }}>
                                    <Tag size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{cat.name}</h3>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        {(cat.recurring_bills_count || 0)} recorrentes · {(cat.monthly_bills_count || 0)} mensais
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 border-t pt-3" style={{ borderColor: 'var(--border-primary)' }}>
                                <button onClick={() => { setEditing(cat); setForm({ name: cat.name, color: cat.color, icon: cat.icon || '' }); setShowModal(true); }}
                                    className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                                    <Pencil size={12} /> Editar
                                </button>
                                <button onClick={() => handleDelete(cat)} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-danger-500)' }}>
                                    <Trash2 size={12} /> Remover
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <h3 className="mb-4 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{editing ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Nome</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cor</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map((c) => (
                                        <button key={c.name} type="button" onClick={() => setForm({ ...form, color: c.name })}
                                            className={`h-8 w-8 rounded-full border-2 transition-transform ${form.color === c.name ? 'scale-110' : ''}`}
                                            style={{ backgroundColor: c.hex, borderColor: form.color === c.name ? 'var(--text-primary)' : 'transparent' }} />
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
