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
            <h2 className="mb-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Bem-vindo de volta
            </h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Entre com suas credenciais para acessar sua conta
            </p>

            {error && (
                <div
                    className="mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
                    style={{
                        backgroundColor: 'var(--color-danger-50)',
                        borderColor: 'var(--color-danger-500)',
                        color: 'var(--color-danger-600)',
                    }}
                >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        E-mail
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
                        style={{
                            backgroundColor: 'var(--bg-input)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)',
                        }}
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Senha
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sua senha"
                            required
                            className="focus-ring w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none transition-colors"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)',
                            }}
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

                {/* Forgot password */}
                <div className="flex justify-end">
                    <Link
                        to="/forgot-password"
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                        Esqueceu a senha?
                    </Link>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
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
            <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Nao tem uma conta?{' '}
                <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                    Criar conta
                </Link>
            </p>
        </AuthLayout>
    );
}
