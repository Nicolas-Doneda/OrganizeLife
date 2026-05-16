import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
    withXSRFToken: true,
});

// ── Debounce / Deduplicação de requisições idênticas ──────────────────
// Previne que a mesma requisição POST/PUT/PATCH/DELETE seja disparada
// duas vezes dentro de um curto intervalo (ex: double-click).
const pendingRequests = new Map();
const DEBOUNCE_WINDOW_MS = 800;

function buildRequestKey(config) {
    // Apenas para métodos mutantes (POST, PUT, PATCH, DELETE)
    const method = (config.method || 'get').toLowerCase();
    if (['get', 'head', 'options'].includes(method)) return null;

    const url = config.url || '';
    const data = typeof config.data === 'string'
        ? config.data
        : JSON.stringify(config.data || '');

    return `${method}:${url}:${data}`;
}

api.interceptors.request.use((config) => {
    // 1. Adiciona token de autenticação
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Debounce: bloqueia requisições mutantes duplicadas
    const key = buildRequestKey(config);
    if (key) {
        const lastTime = pendingRequests.get(key);
        const now = Date.now();

        if (lastTime && (now - lastTime) < DEBOUNCE_WINDOW_MS) {
            // Rejeita silenciosamente a requisição duplicada
            const source = axios.CancelToken.source();
            config.cancelToken = source.token;
            source.cancel(`[Debounce] Requisição duplicada bloqueada: ${key}`);
            return config;
        }

        pendingRequests.set(key, now);
    }

    return config;
});

// Interceptor: redireciona para login se token expirou (401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Ignora erros de debounce (requisições canceladas intencionalmente)
        if (axios.isCancel(error)) {
            console.debug(error.message);
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            // Redirect apenas se não estiver em rota pública
            if (!window.location.pathname.startsWith('/login') &&
                !window.location.pathname.startsWith('/register')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
