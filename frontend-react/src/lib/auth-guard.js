// Firebase has been removed. Auth state is managed via localStorage.

export function isLoggedIn() {
  return !!localStorage.getItem("tt_user_uid");
}

export function getLocalUser() {
  const uid = localStorage.getItem("tt_user_uid");
  const name = localStorage.getItem("tt_user_name");
  const role = localStorage.getItem("tt_user_role");
  if (!uid) return null;
  return { uid, name: name ?? "User", role: role ?? "student" };
}

export function setLocalUser(uid, name, role) {
  localStorage.setItem("tt_user_uid", uid);
  localStorage.setItem("tt_user_name", name);
  localStorage.setItem("tt_user_role", role);
}

export function clearLocalUser() {
  localStorage.removeItem("tt_user_uid");
  localStorage.removeItem("tt_user_name");
  localStorage.removeItem("tt_user_role");
  localStorage.removeItem("tt_exam_mode");
}

export function requireAuth(navigate, returnTo) {
  if (isLoggedIn()) return true;
  const next = returnTo ?? window.location.pathname;
  navigate(`/login?next=${encodeURIComponent(next)}`);
  return false;
}

export async function getAuthToken() {
  return localStorage.getItem("tt_auth_token") ?? null;
}
