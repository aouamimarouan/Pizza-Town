import axios from 'axios';

const api = axios.create({
  // Utilise l'URL du backend définie dans .env, avec localhost:5000 par défaut
  baseURL: import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request Interceptor no longer needs to attach JWT, HttpOnly cookie handles it.

// ─── Response Interceptor ─────────────────────────────────────────────────
// If the token is expired or invalid (401), clear storage and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pt_user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
