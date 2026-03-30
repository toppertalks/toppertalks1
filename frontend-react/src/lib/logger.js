const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

export function logActivity(data) {
  fetch(`${API_BASE}/api/auth/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timestamp: new Date().toISOString(), ...data }),
  }).catch(() => {}); // fire-and-forget
}
