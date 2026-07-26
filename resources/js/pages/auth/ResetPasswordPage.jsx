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
        <AuthLayout>
            <div className="mb-6">
                <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    Redefinir senha
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Escolha uma nova senha forte para sua segurança
                </p>
            </div>

            {status === 'success' ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-4">
                    <CheckCircle2 size={40} style={{ color: 'var(--color-success-500)' }} />
                    <p className="text-center text-xs tracking-wide leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {message}
                    </p>
                    <Link
                        to="/login"
                        className="btn-primary mt-4 flex w-full justify-center py-3 text-xs font-semibold uppercase tracking-widest"
                    >
                        Fazer login agora
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Exibe erro */}
                    {status === 'error' && (
                        <div
                            className="mb-5 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs animate-in"
                            style={{
                                backgroundColor: 'var(--color-danger-50)',
                                border: '2px double var(--color-danger-500)',
                                color: 'var(--color-danger-600)',
                            }}
                        >
                            <span>{message}</span>
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-xs font-semibold tracking-wide text-[var(--text-secondary)]">
                            Nova Senha
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength="8"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="input-base pr-10 text-sm focus-ring"
                                placeholder="********"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold tracking-wide text-[var(--text-secondary)]">
                            Confirmação de Senha
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength="8"
                            value={form.password_confirmation}
                            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                            className="input-base text-sm focus-ring"
                            placeholder="********"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading' || !token}
                        className="btn-primary w-full py-3 text-xs font-mono uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {status === 'loading' ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                            'Salvar nova senha'
                        )}
                    </button>
                    
                    <div className="mt-6 flex justify-center">
                        <Link
                            to="/login"
                            className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider transition-colors hover:underline"
                            style={{ color: 'var(--color-primary-600)' }}
                        >
                            <ArrowLeft size={12} />
                            Voltar para o login
                        </Link>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
}
