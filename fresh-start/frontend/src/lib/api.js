import axios from 'axios';

// If VITE_API_BASE_URL is set, use it directly; otherwise rely on the Vite
// dev proxy that forwards /api -> http://localhost:8000.
const baseURL = import.meta.env.VITE_API_BASE_URL || '';

export const ACCESS_KEY = 'tt_access_token';
export const REFRESH_KEY = 'tt_refresh_token';

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ access_token, refresh_token }) => {
    if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Authorization header on every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Refresh token rotation -------------------------------------------------

let isRefreshing = false;
let pendingRequests = [];

const onRefreshed = (newAccess) => {
  pendingRequests.forEach((cb) => cb(newAccess));
  pendingRequests = [];
};

const addPending = (cb) => pendingRequests.push(cb);

let onAuthFailureCallback = null;
export const setOnAuthFailure = (fn) => {
  onAuthFailureCallback = fn;
};

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Don't try to refresh for the refresh/login/logout endpoints themselves.
    const url = original?.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout');

    if (status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const refresh = tokenStore.getRefresh();
    if (!refresh) {
      tokenStore.clear();
      onAuthFailureCallback?.();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh finishes.
      return new Promise((resolve, reject) => {
        addPending((newAccess) => {
          if (!newAccess) return reject(error);
          original.headers.Authorization = `Bearer ${newAccess}`;
          original._retry = true;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post(
        `${baseURL}/api/v1/auth/refresh`,
        { refresh_token: refresh },
        { headers: { 'Content-Type': 'application/json' } }
      );
      tokenStore.set(data);
      onRefreshed(data.access_token);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      original._retry = true;
      return api(original);
    } catch (e) {
      onRefreshed(null);
      tokenStore.clear();
      onAuthFailureCallback?.();
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

// --- Auth API helpers -------------------------------------------------------

export const authApi = {
  login: (email, password, mfa_code) =>
    api.post('/api/v1/auth/login', { email, password, mfa_code }),
  register: (payload) => api.post('/api/v1/auth/register', payload),
  me: () => api.get('/api/v1/auth/me'),
  logout: (refresh_token) =>
    api.post('/api/v1/auth/logout', { refresh_token }),

  requestVerification: () => api.post('/api/v1/auth/request-verification'),
  verifyEmail: (token) => api.post('/api/v1/auth/verify-email', { token }),
  sendVerificationOtp: (email) =>
    api.post('/api/v1/auth/send-verification-otp', { email }),
  verifyEmailOtp: (email, otp) =>
    api.post('/api/v1/auth/verify-email-otp', { email, otp }),

  forgotPassword: (email) =>
    api.post('/api/v1/auth/forgot-password', { email }),
  resetPassword: (token, new_password) =>
    api.post('/api/v1/auth/reset-password', { token, new_password }),

  googleUrl: () => api.get('/api/v1/auth/google/url'),
  googleCallback: (code, state) =>
    api.post('/api/v1/auth/google/callback', { code, state }),
};
