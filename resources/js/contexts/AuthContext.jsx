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
            setUser(response.data.data.user);
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

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        fetchUser,
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
