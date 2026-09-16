import axios from 'axios';

const getApiBaseUrl = () => {
  let backend = import.meta.env.VITE_BACKEND_URL;
  if (!backend) {
    const isBrowser = typeof window !== 'undefined';
    const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    backend = isLocalhost ? 'http://localhost:5000' : 'https://app-736fedd4-3a26-44ac-a5cc-6b340c821ab3.cleverapps.io';
  }
  return `${backend.replace(/\/$/, '')}/api`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── Request Interceptor ──────────────────────────────────────────────────
// Attaches Bearer token (essential for iOS Safari & mobile cross-site cookie restrictions)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pt_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────
// If the token is expired or invalid (401), clear storage and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pt_user');
      localStorage.removeItem('pt_token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
