// Compatibility shim for pages ported from the legacy frontend.
// They imported `isLoggedIn`, `getLocalUser`, `getAuthToken` from `auth-guard`.
// Map those to the fresh-start token store.
import { tokenStore } from './api';

export const isLoggedIn = () => Boolean(tokenStore.getAccess());

export const getAuthToken = () => tokenStore.getAccess();

export const getLocalUser = () => {
  // Cached profile, populated by AuthContext on login.
  try {
    const raw = localStorage.getItem('tt_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setLocalUser = (user) => {
  if (user) {
    localStorage.setItem('tt_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('tt_user');
  }
};

// Used by ported pages: redirect to /login if not signed in, return true if ok.
export const requireAuth = (navigate, next = null) => {
  if (isLoggedIn()) return true;
  const target = next
    ? `/login?next=${encodeURIComponent(next)}`
    : '/login';
  navigate(target);
  return false;
};
