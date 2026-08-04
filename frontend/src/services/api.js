import axios from 'axios';

const api = axios.create({
  // Utilise l'URL du backend définie dans .env, avec localhost:5000 par défaut
  baseURL: import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── Request Interceptor ───────────────────────────────────────────────────
// Automatically attach the JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────
// If the token is expired or invalid, clear storage and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('pt_token');
      localStorage.removeItem('pt_user');
      // Dispatch a custom event so App.jsx can react
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
