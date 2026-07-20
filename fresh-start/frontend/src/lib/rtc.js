// Lightweight signaling-channel client.
// - Connects to FastAPI WebSocket at /api/v1/rtc/ws/{sessionId}?token=...
// - Auto-reconnects with backoff
// - Heartbeat ping so idle connections aren't dropped
//
// Usage:
//   const sig = new SignalingClient(sessionId, accessToken);
//   sig.on('MENTOR_JOINED', (msg) => ...);
//   sig.connect();
//   sig.send({ type: 'CALL_ACCEPTED' });
//   sig.close();

import { tokenStore } from "./api.js";

const WS_BASE = (() => {
  // If an explicit API base is set (prod), build wss:// from it.
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    const u = new URL(apiBase);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return u.origin;
  }
  // Dev: use current page origin -> Vite proxy forwards /api to FastAPI.
  const { protocol, host } = window.location;
  return `${protocol === "https:" ? "wss:" : "ws:"}//${host}`;
})();

export class SignalingClient {
  constructor(sessionId, token) {
    this.sessionId = sessionId;
    this.token = token || tokenStore.getAccess();
    this.ws = null;
    this.listeners = new Map(); // type -> Set<fn>
    this.shouldRun = false;
    this.retry = 0;
    this.pingTimer = null;
  }

  on(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
    return () => this.listeners.get(type)?.delete(fn);
  }

  emit(type, payload) {
    this.listeners.get(type)?.forEach((fn) => {
      try { fn(payload); } catch (e) { console.error("[signaling]", type, e); }
    });
    this.listeners.get("*")?.forEach((fn) => fn({ type, ...payload }));
  }

  connect() {
    this.shouldRun = true;
    this._open();
  }

  _open() {
    const url = `${WS_BASE}/api/v1/rtc/ws/${this.sessionId}?token=${encodeURIComponent(this.token)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.retry = 0;
      this.emit("OPEN", {});
      this._startHeartbeat();
    };

    this.ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (!msg.type) return;
      this.emit(msg.type, msg);
    };

    this.ws.onclose = (ev) => {
      this._stopHeartbeat();
      this.emit("CLOSE", { code: ev.code, reason: ev.reason });
      if (this.shouldRun && ev.code !== 1008 /* policy */) {
        const delay = Math.min(1000 * 2 ** this.retry, 10000);
        this.retry += 1;
        setTimeout(() => this.shouldRun && this._open(), delay);
      }
    };

    this.ws.onerror = (e) => this.emit("ERROR", { error: e });
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "PING" }));
      }
    }, 25000);
  }

  _stopHeartbeat() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }

  send(obj) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  close() {
    this.shouldRun = false;
    this._stopHeartbeat();
    try { this.ws?.close(1000, "client closed"); } catch {}
    this.ws = null;
  }
}

// --- REST helpers around the /rtc endpoints --------------------------------
import { api } from "./api.js";

export async function initiateCall(topperId, mode = "video") {
  const { data } = await api.post("/api/v1/rtc/initiate", { topperId, mode });
  return data; // { sessionId, roomName, mode, topperName }
}

export async function joinCall(sessionId) {
  const { data } = await api.post("/api/v1/rtc/join", { sessionId });
  return data; // { sessionId, roomName, livekitUrl, livekitToken, role }
}

export async function endCall(sessionId) {
  const { data } = await api.post("/api/v1/sessions/end", { sessionId });
  return data;
}
