import api from './api.js';

const USER_KEY  = 'pt_user';

// ─── Helpers ──────────────────────────────────────────────────────────────
const saveSession = ({ user }) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
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
 * @returns {{ user }}
 */
export const register = async (data) => {
  const res = await api.post('/auth/register', data);
  saveSession(res.data);
  return res.data;
};

/**
 * Login an existing user.
 * @param {{ email, password }} data
 * @returns {{ user }}
 */
export const login = async (data) => {
  const res = await api.post('/auth/login', data);
  saveSession(res.data);
  return res.data;
};

/**
 * Logout: clear cookie on backend and clear storage.
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.error('Failed to logout from server', err);
  }
  clearSession();
};

/**
 * Fetch the current user profile (requires valid cookie).
 * @returns {User}
 */
export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

/**
 * Request a password reset link.
 * @param {string} email
 * @returns {Promise<{message: string}>}
 */
export const forgotPassword = async (email) => {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

/**
 * Reset password using the token.
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<{message: string}>}
 */
export const resetPassword = async (token, newPassword) => {
  const res = await api.post('/auth/reset-password', { token, newPassword });
  return res.data;
};
