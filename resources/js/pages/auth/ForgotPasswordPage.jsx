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
        <AuthLayout title="Esqueceu a senha?" subtitle="Digite seu e-mail para receber um link de recuperação.">
            {status === 'success' ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <CheckCircle2 size={48} className="text-success-500" style={{ color: 'var(--color-success-500)' }} />
                    <p className="text-center text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {message}
                    </p>
                    <Link
                        to="/login"
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-[15px] font-semibold transition-all hover:bg-[var(--bg-hover)] active:scale-[0.98]"
                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
                    >
                        <ArrowLeft size={18} />
                        Voltar para o login
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Mensagem de Erro (se houver) */}
                    {status === 'error' && (
                        <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: 'var(--color-danger-50)', color: 'var(--color-danger-600)' }}>
                            {message}
                        </div>
                    )}

                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            E-mail
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                                <Mail size={18} style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="focus-ring w-full rounded-xl border py-3 pl-11 pr-4 text-[15px] transition-all outline-none"
                                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="btn-primary mt-2 w-full py-3 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'loading' ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                            'Enviar link de recuperação'
                        )}
                    </button>

                    {/* Back to Login */}
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
