import { logActivity } from "./logger";
import { api } from "./axios";

const apiJson = async (method, path, body) => {
	const response = await api({ method, url: path, data: body });
	return response.data;
};

const apiGet = async (path) => {
	const response = await api.get(path);
	return response.data;
};

// Toppers
export async function fetchToppers(exam, limit = 20) {
	logActivity({ event: "toppers_fetch", exam: exam ?? "ALL", limit });
	const params = new URLSearchParams();
	if (exam) params.set("exam", exam);
	params.set("limit", String(limit));
	const result = await apiGet(`/api/toppers?${params}`);
	logActivity({
		event: "toppers_loaded",
		count: result.toppers?.length ?? 0,
		cached: result.cached,
	});
	return result;
}

export async function fetchTopper(id) {
	logActivity({
		event: "button_click",
		button: "view_topper_profile",
		topperId: id,
	});
	return apiGet(`/api/toppers/${id}`);
}

export async function updateTopperStatus(id, isOnline) {
	logActivity({ event: "topper_status_toggle", uid: id, isOnline });
	try {
		const result = await apiJson("patch", `/api/toppers/${id}/status`, {
			isOnline,
		});
		logActivity({ event: "topper_status_success", uid: id, isOnline });
		return result;
	} catch (err) {
		logActivity({ event: "topper_status_error", uid: id, error: err.message });
		throw err;
	}
}

// Sessions
export async function startSession(topperId) {
	const uid = localStorage.getItem("tt_user_uid");
	logActivity({ event: "call_start_attempt", uid, topperId });
	try {
		const result = await apiJson("post", "/api/sessions/start", { topperId });
		logActivity({
			event: "call_start_success",
			sessionId: result.sessionId,
			topperName: result.topperName,
			uid,
		});
		return result;
	} catch (err) {
		logActivity({
			event: "call_start_error",
			uid,
			topperId,
			error: err.message,
		});
		throw err;
	}
}

export async function endSession(sessionId) {
	logActivity({ event: "call_end_attempt", sessionId });
	try {
		const result = await apiJson("post", "/api/sessions/end", { sessionId });
		logActivity({
			event: "call_end_success",
			sessionId,
			durationSeconds: result.durationSeconds,
			amountCharged: result.amountCharged,
		});
		return result;
	} catch (err) {
		logActivity({ event: "call_end_error", sessionId, error: err.message });
		throw err;
	}
}

export async function reportSession(sessionId, reason) {
	logActivity({ event: "call_report", sessionId, reason });
	return apiJson("post", "/api/sessions/report", { sessionId, reason });
}

export async function fetchSessions(role = "student", limit = 20) {
	logActivity({ event: "button_click", button: "fetch_sessions", role });
	const params = new URLSearchParams({ role, limit: String(limit) });
	return apiGet(`/api/sessions?${params}`);
}

// Wallet
export async function fetchWallet() {
	const uid = localStorage.getItem("tt_user_uid");
	logActivity({ event: "wallet_fetch", uid });
	const result = await apiGet("/api/wallet");
	logActivity({
		event: "wallet_loaded",
		uid,
		balance: result.balance,
		txCount: result.transactions?.length,
	});
	return result;
}

export async function addMoney(amount, paymentId) {
	const uid = localStorage.getItem("tt_user_uid");
	logActivity({ event: "wallet_topup_attempt", uid, amount });
	try {
		const result = await apiJson("post", "/api/wallet", { amount, paymentId });
		logActivity({
			event: "wallet_topup_success",
			uid,
			amount,
			newBalance: result.newBalance,
		});
		return result;
	} catch (err) {
		logActivity({
			event: "wallet_topup_error",
			uid,
			amount,
			error: err.message,
		});
		throw err;
	}
}

// Ratings
export async function submitRating(sessionId, stars, comment) {
	logActivity({ event: "rating_submit", sessionId, stars });
	try {
		const result = await apiJson("post", "/api/ratings", {
			sessionId,
			stars,
			comment,
		});
		logActivity({ event: "rating_success", ratingId: result.ratingId });
		return result;
	} catch (err) {
		logActivity({ event: "rating_error", sessionId, error: err.message });
		throw err;
	}
}

export async function fetchRatings(topperId) {
	return apiGet(`/api/ratings?topperId=${topperId}`);
}

// User Profile
export async function fetchProfile() {
	const uid = localStorage.getItem("tt_user_uid");
	logActivity({ event: "profile_fetch", uid, found: true });
	const result = await apiGet("/api/user/profile");
	logActivity({
		event: "profile_loaded",
		uid,
		name: result.data?.name,
		role: result.data?.role,
	});
	return result;
}

export async function saveProfile(data) {
	const uid = localStorage.getItem("tt_user_uid");
	logActivity({ event: "profile_save", uid, name: data.name, role: data.role });
	return apiJson("post", "/api/user/profile", data);
}

// Mentor Application
export async function submitMentorApplication(data) {
	const uid = localStorage.getItem("tt_user_uid");
	logActivity({ event: "mentor_apply_attempt", uid, name: data.name });
	try {
		const result = await apiJson("post", "/api/mentor-apply", data);
		logActivity({ event: "mentor_apply_success", uid });
		return result;
	} catch (err) {
		logActivity({ event: "mentor_apply_error", uid, error: err.message });
		throw err;
	}
}
