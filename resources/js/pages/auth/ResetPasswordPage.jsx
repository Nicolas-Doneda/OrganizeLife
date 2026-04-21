import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/layouts/AuthLayout';
import api from '../../services/api';
import { Lock, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const emailStr = searchParams.get('email');

    const [form, setForm] = useState({
        email: emailStr || '',
        password: '',
        password_confirmation: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token de recuperação inválido ou ausente da URL.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (form.password !== form.password_confirmation) {
            setStatus('error');
            setMessage('As senhas não coincidem.');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await api.post('/auth/reset-password', {
                token,
                email: form.email,
                password: form.password,
                password_confirmation: form.password_confirmation
            });
            
            setMessage(response.data.message || 'Senha redefinida com sucesso!');
            setStatus('success');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Ocorreu um erro ao redefinir a senha.');
            setStatus('error');
        }
    };

    return (
        <AuthLayout title="Redefinir senha" subtitle="Escolha uma nova senha firme e segura.">
            {status === 'success' ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <CheckCircle2 size={48} className="text-success-500" style={{ color: 'var(--color-success-500)' }} />
                    <p className="text-center text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {message}
                    </p>
                    <Link
                        to="/login"
                        className="btn-primary mt-4 flex w-full justify-center py-3 text-[15px]"
                    >
                        Fazer login agora
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Exibe erro */}
                    {status === 'error' && (
                        <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: 'var(--color-danger-50)', color: 'var(--color-danger-600)' }}>
                            {message}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Nova Senha
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <Lock size={18} style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength="8"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="focus-ring w-full rounded-xl border py-3 pl-11 pr-11 text-[15px] transition-all outline-none"
                                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                placeholder="********"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Confirmação de Senha
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <Lock size={18} style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength="8"
                                value={form.password_confirmation}
                                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                className="focus-ring w-full rounded-xl border py-3 pl-11 pr-4 text-[15px] transition-all outline-none"
                                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                placeholder="********"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading' || !token}
                        className="btn-primary mt-2 w-full py-3 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'loading' ? (
                            <div className="flex justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /></div>
                        ) : (
                            'Salvar nova senha'
                        )}
                    </button>
                    
                    <div className="mt-6 flex justify-center">
                        <Link
                            to="/login"
                            className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                            style={{ color: 'var(--color-primary-600)' }}
                        >
                            <ArrowLeft size={16} />
                            Voltar para o login
                        </Link>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
}
