import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import { User, Camera, Save, Check, Upload, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const AVATAR_COLORS = [
    '#059669', '#e11d48', '#d97706', '#16a34a', '#0ea5e9',
    '#78716c', '#dc2626', '#3b82f6', '#ea580c', '#34d399',
    '#f43f5e', '#f59e0b', '#10b981', '#0891b2', '#0284c7', '#7c3aed',
];

function isImageAvatar(avatar) {
    return avatar && !avatar.startsWith('#') && avatar.length > 7;
}

export default function ProfilePage() {
    const { user, avatar_url, fetchUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [budgetNeeds, setBudgetNeeds] = useState(user?.budget_needs_percent ?? 50);
    const [budgetWants, setBudgetWants] = useState(user?.budget_wants_percent ?? 30);
    const [budgetSavings, setBudgetSavings] = useState(user?.budget_savings_percent ?? 20);
    const [avatarColor, setAvatarColor] = useState(
        isImageAvatar(user?.avatar) ? '#6366f1' : (user?.avatar || '#6366f1')
    );
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(
        isImageAvatar(user?.avatar) ? (avatar_url ?? null) : null
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const [twoFaData, setTwoFaData] = useState(null);
    const [twoFaCode, setTwoFaCode] = useState('');

    async function handleEnable2FA() {
        try {
            setError('');
            const res = await api.post('/auth/2fa/enable');
            setTwoFaData(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao ativar 2FA.');
        }
    }

    async function handleConfirm2FA() {
        try {
            setError('');
            await api.post('/auth/2fa/confirm', { code: twoFaCode });
            setTwoFaData(null);
            setTwoFaCode('');
            await fetchUser();
        } catch (err) {
            setError(err.response?.data?.message || 'Codigo invalido.');
        }
    }

    async function handleDisable2FA() {
        const password = prompt('Digite sua senha para desativar o 2FA:');
        if (!password) return;
        try {
            setError('');
            await api.delete('/auth/2fa/disable', { data: { password } });
            await fetchUser();
        } catch (err) {
            setError(err.response?.data?.message || 'Senha incorreta.');
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError('A imagem deve ter no maximo 2MB.');
            return;
        }

        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);
        setError('');
    }

    function removeImage() {
        setAvatarFile(null);
        setAvatarPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSaved(false);

        try {
            if (avatarFile) {
                // Upload com FormData
                const formData = new FormData();
                formData.append('name', name);
                formData.append('avatar', avatarFile);
                formData.append('budget_needs_percent', budgetNeeds);
                formData.append('budget_wants_percent', budgetWants);
                formData.append('budget_savings_percent', budgetSavings);
                await api.post('/auth/profile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    params: { _method: 'PUT' },
                });
            } else {
                await api.put('/auth/profile', {
                    name,
                    avatar: avatarPreview ? undefined : avatarColor,
                    budget_needs_percent: budgetNeeds,
                    budget_wants_percent: budgetWants,
                    budget_savings_percent: budgetSavings,
                });
            }
            await fetchUser();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <AppLayout>
            <div className="mx-auto max-w-2xl">
                <h1 className="mb-1 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    Configurações
                </h1>
                <p className="mb-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Gerencie seu perfil e preferências
                </p>

                <form onSubmit={handleSave}>
                    {/* Avatar */}
                    <div className="mb-8 rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
                        <h2 className="mb-4 text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Avatar</h2>
                        <div className="flex items-start gap-6">
                            {/* Avatar Preview */}
                            <div className="relative group">
                                {avatarPreview ? (
                                    <div className="relative">
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar"
                                            className="h-20 w-20 rounded-full object-cover shadow-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
                                        style={{ backgroundColor: avatarColor }}
                                    >
                                        {name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary-600 text-white shadow-md hover:bg-primary-700 transition-colors"
                                >
                                    <Camera size={12} />
                                </button>
                            </div>

                            <div className="flex-1">
                                {/* Upload button */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5"
                                    style={{ borderColor: 'var(--border-primary)', color: 'var(--color-primary-600)' }}
                                >
                                    <Upload size={14} />
                                    Enviar foto
                                </button>
                                <p className="mb-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    JPG, PNG ou WebP. Max 2MB.
                                </p>

                                {/* Color fallback */}
                                {!avatarPreview && (
                                    <>
                                        <p className="mb-2 text-xs" style={{ color: 'var(--text-secondary)' }}>Ou escolha uma cor</p>
                                        <div className="flex flex-wrap gap-2">
                                            {AVATAR_COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setAvatarColor(color)}
                                                    className={`h-7 w-7 rounded-full border-2 transition-transform ${avatarColor === color ? 'scale-110 ring-2 ring-offset-2' : ''}`}
                                                    style={{
                                                        backgroundColor: color,
                                                        borderColor: avatarColor === color ? 'var(--text-primary)' : 'transparent',
                                                        ringColor: color,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Informacoes */}
                    <div className="mb-8 rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
                        <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Informações</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Nome</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>E-mail</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm opacity-60"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                                />
                                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    O e-mail não pode ser alterado por segurança
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Regra de Orçamento */}
                    <div className="mb-8 rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
                        <h2 className="mb-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Orçamento Inteligente</h2>
                        <p className="mb-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>Defina como você quer dividir seus ganhos de forma ideal (Total alvo: 100%).</p>
                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Gastos Essenciais (Needs)</label>
                                    <span className="text-sm font-bold" style={{ color: 'var(--color-primary-600)' }}>{budgetNeeds}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={budgetNeeds} onChange={(e) => setBudgetNeeds(parseInt(e.target.value))} className="w-full h-2 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-primary-600" />
                                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Moradia, contas básicas, alimentação, transporte.</p>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Estilo de Vida (Wants)</label>
                                    <span className="text-sm font-bold" style={{ color: 'var(--color-warning-600)' }}>{budgetWants}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={budgetWants} onChange={(e) => setBudgetWants(parseInt(e.target.value))} className="w-full h-2 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-warning-600" />
                                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Lazer, restaurantes, hobbies, assinaturas.</p>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Poupança e Investimentos (Savings)</label>
                                    <span className="text-sm font-bold" style={{ color: 'var(--color-success-600)' }}>{budgetSavings}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={budgetSavings} onChange={(e) => setBudgetSavings(parseInt(e.target.value))} className="w-full h-2 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-success-500" />
                                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Reserva de emergência, aposentadoria, objetivos.</p>
                            </div>
                            {budgetNeeds + budgetWants + budgetSavings !== 100 && (
                                <div className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: 'var(--color-danger-50)', color: 'var(--color-danger-600)' }}>
                                    Atenção: A soma das categorias é de {budgetNeeds + budgetWants + budgetSavings}%. O sistema usa as regras assumindo que os gastos não devem passar desses limites em relação à sua renda total.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Conta - 2FA */}
                    <div className="mb-8 rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
                        <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Autenticação de dois fatores</h2>

                        {/* Estado: 2FA desativado */}
                        {!user?.two_factor_enabled && !twoFaData && (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Proteja sua conta</p>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        Adicione uma camada extra de segurança com Google Authenticator
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleEnable2FA}
                                    disabled={saving}
                                    className="btn-primary px-4 py-2">
                                    Ativar 2FA
                                </button>
                            </div>
                        )}

                        {/* Estado: QR Code gerado, aguardando confirmacao */}
                        {twoFaData && (
                            <div className="space-y-4">
                                <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-hover)' }}>
                                    <p className="mb-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        1. Abra o Google Authenticator e escaneie o QR Code ou copie o código abaixo:
                                    </p>
                                    <div className="flex justify-center mb-4">
                                        <div className="rounded-xl bg-white p-4 shadow-sm">
                                            <QRCodeSVG
                                                value={twoFaData.otpauth_url}
                                                size={180}
                                                level="M"
                                                includeMargin={false}
                                            />
                                        </div>
                                    </div>
                                    <p className="mb-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        Ou copie o código manualmente:
                                    </p>
                                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2 mb-3" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-input)' }}>
                                        <code className="flex-1 text-xs break-all" style={{ color: 'var(--text-secondary)' }}>
                                            {twoFaData.secret}
                                        </code>
                                        <button type="button" onClick={() => { navigator.clipboard.writeText(twoFaData.secret); }}
                                            className="shrink-0 rounded px-2 py-1 text-xs font-medium hover:bg-black/5"
                                            style={{ color: 'var(--color-primary-600)' }}>
                                            Copiar
                                        </button>
                                    </div>
                                    <p className="mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        2. Digite o código de 6 dígitos do app:
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={twoFaCode}
                                            onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            className="focus-ring w-32 rounded-lg border px-4 py-2.5 text-sm text-center font-mono tracking-widest outline-none"
                                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                        />
                                        <button type="button" onClick={handleConfirm2FA} disabled={twoFaCode.length !== 6}
                                            className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                                            Confirmar
                                        </button>
                                    </div>
                                </div>

                                {/* Codigos de recuperacao */}
                                <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-warning-300)', backgroundColor: 'var(--color-warning-50)' }}>
                                    <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--color-warning-700)' }}>
                                        Salve seus códigos de recuperação em local seguro:
                                    </p>
                                    <div className="grid grid-cols-2 gap-1">
                                        {twoFaData.recovery_codes?.map((code, i) => (
                                            <code key={i} className="text-xs font-mono" style={{ color: 'var(--color-warning-800)' }}>{code}</code>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Estado: 2FA ativo */}
                        {user?.two_factor_enabled && !twoFaData && (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-success-600)' }}>✓ 2FA ativo</p>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        Sua conta está protegida com autenticação de dois fatores
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDisable2FA}
                                    className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-red-50"
                                    style={{ borderColor: 'var(--color-danger-300)', color: 'var(--color-danger-500)' }}
                                >
                                    Desativar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Error/Success */}
                    {error && (
                        <div className="mb-4 rounded-lg border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-danger-50)', borderColor: 'var(--color-danger-500)', color: 'var(--color-danger-600)' }}>
                            {error}
                        </div>
                    )}

                    {/* Save button */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary px-6 py-2.5 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : saved ? (
                            <Check size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        {saved ? 'Salvo!' : 'Salvar alterações'}
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}
