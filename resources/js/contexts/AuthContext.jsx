import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Verifica se tem token salvo e busca dados do usuário
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    async function fetchUser() {
        try {
            const response = await api.get('/auth/me');
            const { user, avatar_url, has_2fa, budget_needs_percent, budget_wants_percent, budget_savings_percent } = response.data.data;
            setUser({
                ...user,
                avatar_url,
                two_factor_enabled: has_2fa,
                budget_needs_percent,
                budget_wants_percent,
                budget_savings_percent
            });
        } catch {
            localStorage.removeItem('auth_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(email, password) {
        const response = await api.post('/auth/login', { email, password });

        if (response.data.requires_2fa) {
            localStorage.setItem('auth_token', response.data.data.temp_token);
            return { requires2fa: true };
        }

        localStorage.setItem('auth_token', response.data.data.token);
        setUser(response.data.data.user);
        return { requires2fa: false };
    }

    async function register(name, email, password, passwordConfirmation) {
        const response = await api.post('/auth/register', {
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
        });

        localStorage.setItem('auth_token', response.data.data.token);
        setUser(response.data.data.user);
    }

    async function logout() {
        try {
            await api.post('/auth/logout');
        } catch {
            // Se falhar, limpa local mesmo assim
        }
        localStorage.removeItem('auth_token');
        setUser(null);
    }

    async function verify2fa(code) {
        const response = await api.post('/auth/2fa/verify', { code });
        localStorage.setItem('auth_token', response.data.data.token);
        setUser(response.data.data.user);
    }

    async function recovery2fa(recovery_code) {
        const response = await api.post('/auth/2fa/recovery', { recovery_code });
        localStorage.setItem('auth_token', response.data.data.token);
        setUser(response.data.data.user);
    }

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        fetchUser,
        verify2fa,
        recovery2fa,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
    }
    return context;
}
