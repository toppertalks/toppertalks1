// Firebase Auth has been removed. Replace with your chosen auth provider.
// All functions below are stubs that throw errors until a real provider is wired in.

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

function _notConfigured(method) {
  return Promise.reject(
    new Error(`Auth not configured: '${method}' — replace Firebase Auth with your chosen auth provider.`)
  );
}

export async function signInWithGoogle() {
  return _notConfigured("signInWithGoogle");
}

export async function getGoogleRedirectResult() {
  return null;
}

export async function signUpWithEmail(_email, _password) {
  return _notConfigured("signUpWithEmail");
}

export async function signInWithEmail(_email, _password) {
  return _notConfigured("signInWithEmail");
}

export async function sendPasswordReset(_email) {
  return _notConfigured("sendPasswordReset");
}

export function setupRecaptcha(_buttonId) {
  throw new Error("Auth not configured: setupRecaptcha");
}

export async function sendOTP(_phoneNumber) {
  return _notConfigured("sendOTP");
}

export async function verifyOTP(_confirmation, _otp) {
  return _notConfigured("verifyOTP");
}

// Profile management via API
export async function saveUserProfile(user, profile) {
  const token = localStorage.getItem("tt_auth_token");
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/api/user/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: profile.name,
      role: profile.role,
      examMode: profile.examMode ?? "JEE",
    }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail ?? data.error ?? "Failed to save profile");
  }
}

export async function getUserProfile(_uid) {
  const token = localStorage.getItem("tt_auth_token");
  if (!token) return null;
  const res = await fetch(`${API_BASE}/api/user/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) ?? null;
}

export async function signOut() {
  localStorage.removeItem("tt_auth_token");
  localStorage.removeItem("tt_user_uid");
  localStorage.removeItem("tt_user_name");
  localStorage.removeItem("tt_user_role");
  localStorage.removeItem("tt_exam_mode");
}

export function onAuthChange(_callback) {
  // No real-time auth state listener without Firebase.
  // Call callback with null immediately to indicate signed-out state.
  _callback(null);
  return () => {};
}

export function getCurrentUser() {
  const uid = localStorage.getItem("tt_user_uid");
  if (!uid) return null;
  return {
    uid,
    displayName: localStorage.getItem("tt_user_name") ?? null,
    email: null,
    getIdToken: () => Promise.resolve(localStorage.getItem("tt_auth_token") ?? ""),
  };
}
