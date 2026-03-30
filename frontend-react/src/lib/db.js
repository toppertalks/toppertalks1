// Firebase Firestore has been removed. Data is now fetched via the backend API.

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

function getToken() {
  return localStorage.getItem("tt_auth_token");
}

async function apiFetch(path) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

export async function getUser(_uid) {
  return apiFetch("/api/user/profile");
}

export async function getToppers(examFilter) {
  const params = examFilter ? `?exam=${examFilter}` : "";
  const result = await apiFetch(`/api/toppers${params}`);
  return result?.toppers ?? [];
}

export async function getTopper(uid) {
  return apiFetch(`/api/toppers/${uid}`);
}

export function listenToNotifications(_uid, callback) {
  // Real-time listener not available without Firebase.
  // Returns an empty list immediately; wire up a polling or WebSocket solution here.
  callback([]);
  return () => {};
}
