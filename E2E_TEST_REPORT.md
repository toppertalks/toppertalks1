# TopperTalks — End-to-End Test Report

**Date:** 2026-07-27
**Scope:** Bring the full stack up locally, exercise it end-to-end, and report what works and what doesn't.
**Environment:** macOS (Apple Silicon), Docker Desktop 29.3.1, Python 3.13, Node 25.

---

## 1. Summary

| Layer | Result |
|---|---|
| Backend API (business logic) | ✅ **Fully functional** — 19/19 endpoint tests pass |
| Backend infra (Postgres, Redis) | ✅ Healthy after workarounds |
| Docker Compose (as shipped) | ❌ **Does not boot** — 3 separate config bugs |
| Frontend build | ⚠️ Boots only after adding 2 missing npm deps |
| Frontend ↔ Backend integration | ❌ **Broken** — auth is stubbed; no user can log in |

**Bottom line:** The backend is genuinely production-quality and its billing/wallet/session logic is correct and verified. But the app **cannot be run end-to-end by a real user**: the shipped Docker Compose stack fails to start, the frontend is missing build dependencies, and the authentication layer is entirely stubbed, so the frontend can never obtain the token every API call requires.

---

## 2. What I had to do to get it running

The app does not start from a clean checkout with the documented steps. Workarounds required:

1. **Docker Compose backend crash-loops (SIGILL / exit 132).** The `cryptography` wheel (unpinned → resolved to 49.0.0) crashes with an illegal-instruction fault inside Docker Desktop's Linux VM on this machine. Pinning to 42.0.8 did not help. → **Ran the backend natively** on the host instead.
2. **PgBouncer is misconfigured (two bugs).**
   - Compose maps `6432:6432`, but the `edoburu/pgbouncer` image listens on **5432** internally → the published port forwards to nothing (`connection refused`).
   - `AUTH_TYPE: md5` fails against Postgres 16, which uses `scram-sha-256` → `wrong password type`.
   → **Bypassed PgBouncer**, pointed the backend directly at Postgres.
3. **Host Python is 3.14**, too new for pinned `pydantic==2.9.2` (Rust build fails). → Used **Python 3.13**.
4. **Frontend won't compile** — `zego-express-engine-webrtc` needs `protobufjs` and `long`, which are not declared as dependencies. → **`npm install protobufjs long`** to get a successful build.

Only after all four workarounds did both services run: backend `GET /health` → `{"status":"healthy","postgres":"ok","redis":"ok"}`, frontend serving on `:3000`.

---

## 3. Backend API testing (the good news)

I exercised every route over real HTTP (ASGI), overriding only the Firebase token check (which needs a real Google-signed token, unavailable locally). **All 19 checks passed:**

- ✅ Auth gating: no token → `403`; invalid token → `401` (correct).
- ✅ `GET /api/toppers`, `GET /api/toppers/{id}` — return seeded topper.
- ✅ `GET /api/wallet` — new user starts at balance 0.
- ✅ `POST /api/wallet` **without paymentId → rejected** (422). With paymentId → `200`, balance = 100.
- ✅ **Duplicate paymentId → 400** "Payment already processed" (replay protection works).
- ✅ `POST /api/sessions/start` → returns sessionId + topper name.
- ✅ `POST /api/sessions/end` → **billing correct**: short call charged flat ₹50; wallet debited 100→50.
- ✅ Transaction `createdAt` returned as **ISO string** (`2026-07-27T…Z`).
- ✅ `POST /api/ratings` — creates rating, updates topper average.
- ✅ Insufficient-balance guard: start with balance < ₹50 → `400`.
- ✅ `GET /api/sessions?role=topper` — session history visible to topper.
- ✅ `POST /api/auth/event` — accepts events.
- ✅ `POST /api/mentor-apply` — accepts `{exam, rank}` objects (matches frontend payload).

The backend is well-built: rate limiting, structured logging, CORS whitelist, payment dedup, atomic session-count increment, graceful Redis degradation.

---

## 4. Critical defects (blocking end-to-end use)

### 🔴 D1 — Authentication is entirely stubbed; nobody can log in
`frontend-react/src/lib/auth.js`: `signInWithGoogle`, `signInWithEmail`, `signUpWithEmail` all `reject("Auth not configured")`. These are the **only** code paths that write `tt_auth_token` to localStorage. Since every `apiFetch` throws "Not authenticated" without that token, **no authenticated feature works from the UI**. Confirmed live: `LoginPage` → any sign-in button → error toast.

### 🔴 D2 — WalletPage top-up always fails
`WalletPage.js:41` calls `addMoney(finalAmount)` with **no `paymentId`**. The backend requires it and returns an error (verified: `422 Field required`). Every wallet top-up from the UI would fail (if a user could even reach it past D1).

### 🔴 D3 — Docker Compose stack does not boot
Bugs #1–#2 above (cryptography SIGILL + PgBouncer port/auth). As shipped, `docker-compose up` never reaches a healthy backend.

### 🔴 D4 — Frontend missing build dependencies
`protobufjs` and `long` are required transitively by the Zego SDK but not declared, so `npm start`/`npm build` fails on a clean install.

---

## 5. High-priority issues

### 🟠 H1 — Transaction dates render blank
`WalletPage.js:161` uses `tx.createdAt?.toDate` (a Firestore Timestamp method). The backend returns ISO **strings**, so `.toDate` is always undefined → every transaction shows an empty date.

### 🟠 H2 — Committed secret
`frontend-react/src/lib/zego.js` hardcodes `ZEGO_APP_ID` **and the `ZEGO_APP_SIGN` secret** in source. It also returns a hardcoded topper user ID (`topper_ananya_83813256`).

### 🟠 H3 — `cryptography` unpinned
`requirements.txt` pins everything except `cryptography` (pulled by `python-jose[cryptography]`), which is what resolved to the crashing 49.0.0.

---

## 6. Medium / product-completeness issues

- 🟡 **Most of the UI is mock data.** 7 of the main pages are hardcoded and never call the API: `HomePage`, `SearchPage`, `RandomPage`, `TopperProfilePage`, `AdminPage`, `MessagesPage`, `ProfilePage`. Only `WalletPage`, `ChatPage`, `TopperDashboardPage`, `BecomeMentorPage` make real calls.
- 🟡 Even "real" pages carry fake stats (WalletPage "Spent this week/Calls made/Avg"; TopperDashboard earnings/payout).
- 🟡 Wallet `POST` validates `amount > 0` only — the ₹50 minimum is enforced **client-side only**; the API accepts ₹1.
- 🟡 Session billing does a **read-then-write** wallet update (`balance = old - amount`), which is race-prone under concurrent calls (topper count uses an atomic increment, but wallet balance does not).
- 🟡 `BecomeMentorPage` file uploads are non-functional (no handlers).

---

## 7. What's genuinely good

- Backend architecture: async SQLAlchemy 2.0, writer/reader engine split, Redis cache-aside with TTLs, slowapi rate limiting, Sentry hook, JSON logging.
- Correct, verified billing math and 60/40 split.
- Payment replay protection (dedup on `payment_id`).
- Real `/health` that checks both Postgres and Redis.
- Clean auth gating (403/401 as appropriate).
- Deterministic Alembic naming convention; non-root Docker user.

---

## 8. Recommended fix order

1. **D4 / D3** — declare `protobufjs`+`long`; fix PgBouncer port (`5432` internal) and `AUTH_TYPE`; pin `cryptography`. (Gets the stack bootable.)
2. **D1** — wire a real auth provider (or a dev-mode token issuer) so login produces `tt_auth_token`.
3. **D2 + H1** — pass a `paymentId` to `addMoney`; render `tx.createdAt` as a string.
4. **H2** — move the Zego secret to env / server-side token generation.
5. **Product** — point the 7 mock pages at the existing (working) API endpoints.
6. **Hardening** — enforce ₹50 min server-side; make wallet debit atomic.

---

*Note: verification used a temporary test harness (since removed) and required local workarounds; no application source was modified.*
