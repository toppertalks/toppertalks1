// Domain API helpers (toppers, sessions, wallet, ratings, mentor, events, user profile).
// Wraps the shared axios instance in `./api.js` which already handles
// JWT injection + refresh rotation.
import { api } from './api';

const V1 = '/api/v1';

// --- Toppers ----------------------------------------------------------------
export const fetchToppers = (params = {}) =>
  api.get(`${V1}/toppers`, { params }).then((r) => r.data);

export const fetchTopper = (id) =>
  api.get(`${V1}/toppers/${id}`).then((r) => r.data);

export const updateTopperStatus = (id, isOnline) =>
  api.patch(`${V1}/toppers/${id}/status`, { isOnline }).then((r) => r.data);

export const upsertMyTopperProfile = (payload) =>
  api.post(`${V1}/toppers/me`, payload).then((r) => r.data);

// --- Sessions ---------------------------------------------------------------
export const startSession = (topperId) =>
  api.post(`${V1}/sessions/start`, { topperId }).then((r) => r.data);

export const endSession = (sessionId) =>
  api.post(`${V1}/sessions/end`, { sessionId }).then((r) => r.data);

export const reportSession = (sessionId, reason) =>
  api.post(`${V1}/sessions/report`, { sessionId, reason }).then((r) => r.data);

export const listMySessions = (role = 'student') =>
  api.get(`${V1}/sessions`, { params: { role } }).then((r) => r.data);

// --- Wallet -----------------------------------------------------------------
export const fetchWallet = () =>
  api.get(`${V1}/wallet`).then((r) => r.data);

export const addMoney = (amount, paymentId) =>
  api.post(`${V1}/wallet`, { amount, paymentId }).then((r) => r.data);

// --- Ratings ----------------------------------------------------------------
export const submitRating = (sessionId, stars, comment = '') =>
  api.post(`${V1}/ratings`, { sessionId, stars, comment }).then((r) => r.data);

export const fetchRatings = (topperId, limit = 20) =>
  api.get(`${V1}/ratings`, { params: { topperId, limit } }).then((r) => r.data);

// --- Mentor -----------------------------------------------------------------
export const submitMentorApplication = (payload) =>
  api.post(`${V1}/mentor-apply`, payload).then((r) => r.data);

// --- Events -----------------------------------------------------------------
export const logActivity = ({ event, ...metadata }) =>
  api
    .post(`${V1}/events`, {
      event,
      timestamp: new Date().toISOString(),
      metadata,
    })
    .catch(() => {});

// --- User profile -----------------------------------------------------------
export const fetchUserProfile = () =>
  api.get(`${V1}/user/profile`).then((r) => r.data);

export const updateUserProfile = (payload) =>
  api.post(`${V1}/user/profile`, payload).then((r) => r.data);
