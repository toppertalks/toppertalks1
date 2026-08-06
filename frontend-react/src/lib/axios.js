import axios from "axios";
import { getAccessToken, setAccessToken, clearAuthState } from "./auth";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";
const AUTH_BASE = process.env.REACT_APP_AUTH_URL || "http://localhost:5000";
const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";

const getCookie = (name) => {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(";").shift();
	return null;
};

const api = axios.create({
	baseURL: API_BASE,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

let isRefreshing = false;
let refreshSubscribers = [];

const notifySubscribers = (token) => {
	refreshSubscribers.forEach((callback) => callback(token));
	refreshSubscribers = [];
};

const subscribeTokenRefresh = (callback) => {
	refreshSubscribers.push(callback);
};

const refreshClient = axios.create({
	baseURL: AUTH_BASE,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

const refreshToken = async () => {
	const csrfToken = getCookie(CSRF_COOKIE_NAME);
	if (!csrfToken) {
		throw new Error(
			"CSRF token missing. Please refresh the page and sign in again.",
		);
	}

	const response = await refreshClient.post("/api/auth/refresh", null, {
		headers: {
			[CSRF_HEADER_NAME]: csrfToken,
		},
	});
	const token = response.data?.data?.accessToken;
	if (token) {
		setAccessToken(token);
	}
	return token;
};

api.interceptors.request.use(
	(config) => {
		const token = getAccessToken();
		if (token) {
			config.headers = {
				...config.headers,
				Authorization: `Bearer ${token}`,
			};
		}

		const method = config.method?.toUpperCase();
		const path = config.url || "";
		const mustAttachCsrf = ["/api/auth/refresh", "/api/auth/logout"].some(
			(route) => path.includes(route),
		);

		if (method && method !== "GET") {
			const csrfToken = getCookie(CSRF_COOKIE_NAME);
			if (csrfToken) {
				config.headers = {
					...config.headers,
					[CSRF_HEADER_NAME]: csrfToken,
				};
			}

			if (mustAttachCsrf && !csrfToken) {
				return Promise.reject(
					new Error(
						"Missing CSRF token. Please refresh the page and try again.",
					),
				);
			}
		}

		return config;
	},
	(error) => Promise.reject(error),
);

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		const status = error.response?.status;

		if (
			status === 401 &&
			originalRequest &&
			!originalRequest._retry &&
			!originalRequest.url.includes("/api/auth/refresh") &&
			!originalRequest.url.includes("/api/auth/login") &&
			!originalRequest.url.includes("/api/auth/signup")
		) {
			originalRequest._retry = true;

			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					subscribeTokenRefresh((token) => {
						if (token) {
							originalRequest.headers.Authorization = `Bearer ${token}`;
						}
						resolve(api(originalRequest));
					});
				});
			}

			isRefreshing = true;
			try {
				const token = await refreshToken();
				notifySubscribers(token);
				isRefreshing = false;
				if (token) {
					originalRequest.headers.Authorization = `Bearer ${token}`;
				}
				return api(originalRequest);
			} catch (refreshError) {
				isRefreshing = false;
				notifySubscribers(null);
				clearAuthState();
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export { api, getCookie };
