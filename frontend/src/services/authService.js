import api from './api.js';

const TOKEN_KEY = 'pt_token';
const USER_KEY  = 'pt_user';

// ─── Helpers ──────────────────────────────────────────────────────────────
const saveSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ─── Auth Operations ──────────────────────────────────────────────────────

/**
 * Register a new user.
 * @param {{ full_name, email, password, phone_number?, address? }} data
 * @returns {{ token, user }}
 */
export const register = async (data) => {
  const res = await api.post('/auth/register', data);
  saveSession(res.data);
  return res.data;
};

/**
 * Login an existing user.
 * @param {{ email, password }} data
 * @returns {{ token, user }}
 */
export const login = async (data) => {
  const res = await api.post('/auth/login', data);
  saveSession(res.data);
  return res.data;
};

/**
 * Logout: clear all storage, return to caller for state reset.
 */
export const logout = () => {
  clearSession();
};

/**
 * Fetch the current user profile (requires valid JWT).
 * @returns {User}
 */
export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};
