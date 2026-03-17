import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/layouts/AuthLayout';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.requires2fa) {
                navigate('/2fa-verify');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao fazer login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout>
            <h2 className="mb-1 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                Bem-vindo de volta
            </h2>
            <p className="mb-8 text-[15px]" style={{ color: 'var(--text-tertiary)' }}>
                Acesse seu painel para continuar
            </p>

            {error && (
                <div
                    className="mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm animate-in"
                    style={{
                        backgroundColor: 'var(--color-danger-50)',
                        borderColor: 'var(--color-danger-500)',
                        color: 'var(--color-danger-600)',
                    }}
                >
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                    <label className="mb-2 block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        E-mail
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="input-base"
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="mb-2 block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Senha
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sua senha"
                            required
                            className="input-base pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-[var(--text-primary)]"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Forgot password */}
                <div className="flex justify-end">
                    <Link
                        to="/forgot-password"
                        className="text-sm font-semibold transition-colors"
                        style={{ color: 'var(--color-primary-600)' }}
                    >
                        Esqueceu a senha?
                    </Link>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                        <>
                            <LogIn size={18} />
                            Entrar
                        </>
                    )}
                </button>
            </form>

            {/* Register link */}
            <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Não tem uma conta?{' '}
                <Link to="/register" className="font-semibold transition-colors" style={{ color: 'var(--color-primary-600)' }}>
                    Criar conta
                </Link>
            </p>
        </AuthLayout>
    );
}
