import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/layouts/AuthLayout';
import api from '../../services/api';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setMessage(response.data.message || 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.');
            setStatus('success');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Ocorreu um erro ao enviar o e-mail.');
            setStatus('error');
        }
    };

    return (
        <AuthLayout>
            <div className="mb-6">
                <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    Recuperar senha
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Digite seu e-mail cadastrado para redefinir sua senha
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
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold uppercase tracking-wider transition-all hover:bg-[var(--bg-hover)] active:scale-[0.98]"
                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
                    >
                        <ArrowLeft size={14} />
                        Voltar para o login
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Mensagem de Erro (se houver) */}
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

                    {/* Email Input */}
                    <div>
                        <label htmlFor="email" className="mb-2 block text-xs font-semibold tracking-wide text-[var(--text-secondary)]">
                            Endereço de E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-base text-sm focus-ring"
                            placeholder="seu@email.com"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="btn-primary w-full py-3 text-xs font-mono uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {status === 'loading' ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                            'Enviar Link de Recuperação'
                        )}
                    </button>

                    {/* Back to Login */}
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
