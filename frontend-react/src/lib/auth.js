import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";
const AUTH_BASE = process.env.REACT_APP_AUTH_URL || "http://localhost:5000";
const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";
const AUTH_EVENT_NAME = "tt-auth-event";

const authClient = axios.create({
	baseURL: AUTH_BASE,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

const getCookie = (name) => {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(";").shift();
	return null;
};

let accessToken = null;

const dispatchAuthEvent = (detail) => {
	if (typeof window !== "undefined") {
		window.dispatchEvent(
			new CustomEvent(AUTH_EVENT_NAME, {
				detail,
			}),
		);
	}
};

export function onAuthEvent(listener) {
	if (typeof window === "undefined") {
		return () => {};
	}
	window.addEventListener(AUTH_EVENT_NAME, listener);
	return () => window.removeEventListener(AUTH_EVENT_NAME, listener);
}

export function getAccessToken() {
	return accessToken;
}

export function setAccessToken(token) {
	accessToken = token;
	return token;
}

export function clearAuthState() {
	accessToken = null;
	dispatchAuthEvent({ type: "logout" });
}

export async function signUpWithEmail(name, email, password) {
	const response = await authClient.post("/api/auth/signup", {
		name,
		email,
		password,
	});
	return response.data;
}

export async function signInWithEmail(email, password) {
	const response = await authClient.post("/api/auth/login", {
		email,
		password,
	});
	const payload = response.data?.data;
	if (payload?.accessToken) {
		setAccessToken(payload.accessToken);
	}
	return payload;
}

export async function signOut() {
	try {
		const csrfToken = getCookie(CSRF_COOKIE_NAME);
		await authClient.post("/api/auth/logout", null, {
			headers: csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : undefined,
		});
	} catch (_) {
		// clear session even if logout call fails
	} finally {
		clearAuthState();
	}
}

export async function refresh() {
	const csrfToken = getCookie(CSRF_COOKIE_NAME);
	const response = await authClient.post("/api/auth/refresh", null, {
		headers: csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : undefined,
	});
	const payload = response.data?.data;
	if (payload?.accessToken) {
		setAccessToken(payload.accessToken);
	}
	return payload;
}

export async function verifyEmail(token, email) {
	return authClient.get("/api/auth/verify-email", {
		params: { token, email },
	});
}

export async function sendPasswordReset(email) {
	return authClient.post("/api/auth/request-password-reset", {
		email,
	});
}

export async function resetPassword(token, email, password) {
	return authClient.post("/api/auth/reset-password", {
		token,
		email,
		password,
	});
}

export async function fetchProfile() {
	const response = await axios.get(`${API_BASE}/api/user/profile`, {
		withCredentials: true,
		headers: {
			"Content-Type": "application/json",
			Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
		},
	});
	return response.data?.data;
}
