/**
 * TopperTalks — Auth Guard utility
 * Use requireAuth() before any protected action.
 * Automatically redirects to /login?next=<current_url> if not logged in.
 */

/** Check if user is currently logged in (client-side only) */
export function isLoggedIn(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("tt_user_uid");
}

/** Get logged-in user info from localStorage */
export function getLocalUser() {
    if (typeof window === "undefined") return null;
    const uid = localStorage.getItem("tt_user_uid");
    const name = localStorage.getItem("tt_user_name");
    const role = localStorage.getItem("tt_user_role") as "student" | "topper" | null;
    if (!uid) return null;
    return { uid, name: name ?? "User", role: role ?? "student" };
}

/**
 * Call before any protected action.
 * Returns true if logged in. Returns false and redirects to login if not.
 *
 * Usage:
 *   if (!requireAuth(router)) return;
 */
export function requireAuth(
    router: { push: (url: string) => void },
    returnTo?: string
): boolean {
    if (isLoggedIn()) return true;
    const next = returnTo ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    router.push(`/login?next=${encodeURIComponent(next)}`);
    return false;
}
