# TopperTalks — Deep Technical Analysis

**Date:** 2026-07-28
**Method:** Four parallel deep-dives (security, backend correctness/concurrency, frontend architecture, infra/deployment), each reading the actual source. Highest-impact findings were then **independently re-verified live** against the running stack (noted with ✅ **Verified** below).
**Verdict in one line:** A backend with genuinely strong *foundations* (auth, atomicity-within-a-request, caching, CORS, container hardening) that is undermined by a **broken financial trust model**, **money-losing concurrency races**, a **non-functional core flow**, and an **untested, non-booting deployment**. The frontend is ~85% demo shell behind a dead auth layer.

---

## 0. Severity scoreboard

| # | Severity | Finding | Verified |
|---|----------|---------|----------|
| SEC-1 | 🔴 Critical | Wallet top-up trusts client `amount` — no payment-gateway verification → free money | ✅ |
| BE-1 | 🔴 Critical | `/sessions/end` double-charge race (no status guard, no row lock) | ✅ |
| BE-2 | 🔴 Critical | Wallet balance read-then-write → lost-update race (loses real money) | ✅ |
| BE-3 | 🔴 Critical | `payment_id` dedup is TOCTOU; column not unique → double-credit | ✅ |
| BE-4 | 🔴 Critical | Balance can go arbitrarily negative; no cap / hold / concurrent-session limit | ✅ |
| FE-1 | 🔴 Critical | Auth entirely stubbed — no path to obtain a token; app unusable end-to-end | ✅ |
| INF-1 | 🔴 Critical | Docker Compose does not boot (PgBouncer port + auth + healthcheck bugs) | ✅ |
| INF-2 | 🔴 Critical | CI runs `pytest tests/` but **zero tests exist** → pipeline never passes | ✅ |
| SEC-2 | 🟠 High | ZEGO `APP_SIGN` secret shipped in browser bundle; rooms unauthorized | ✅ |
| SEC-3 | 🟠 High | Rate limiter configured but never enforced (dead) | ✅ |
| SEC-4 | 🟠 High | `/api/auth/event` accepts unauthenticated arbitrary-JSON writes | ✅ |
| BE-5 | 🟠 High | No code path creates a `Topper` → `/sessions/start` always 404s in practice | ✅ |
| INF-3 | 🟠 High | `create_all()` at startup **and** Alembic → schema drift / first-deploy break | ✅ |
| INF-4 | 🟠 High | `reload=True` + `python main.py` is the prod entrypoint (masks crashes, 1 worker) | ✅ |
| BE-6 | 🟠 High | Billing uses per-process `time.time()`; skew/backward-clock → wrong/negative bills | |
| BE-7 | 🟠 High | Rating/report races (no unique constraint); can rate a non-completed session | |
| BE-8 | 🟠 High | `ON DELETE CASCADE` erases transaction ledger when a user is deleted | ✅ |
| Various | 🟡 Medium/Low | Money stored as float, missing bounds, `/docs` always on, no frontend deploy, etc. | mixed |

---

## 1. Money & trust boundary (the most serious cluster)

### 🔴 SEC-1 — Wallet top-up = free money  ✅ Verified
`backend/routes/wallet.py:52-101`. `POST /api/wallet` credits `body.amount` **straight from the client**. There is **no payment-gateway verification anywhere in the backend** — I grepped the whole tree: no `razorpay`, `stripe`, `webhook`, `hmac`, or `verify_signature`. The only guards are `amount > 0`, `paymentId` present, and paymentId-not-seen-before.

> **Exploit (works today for any authenticated user):** `POST /api/wallet {"amount": 999999, "paymentId": "<any new random string>"}` → ₹999,999 credited. A fresh random `paymentId` bypasses the dedup check every time.

Note: this reframes the earlier "WalletPage forgot the paymentId" bug — that frontend omission was *accidentally masking* this deeper flaw. Fixing the frontend alone makes the exploit reachable. **Fix:** create orders server-side with a server-set amount; credit only the amount confirmed by the PSP via signature/webhook verification.

### 🔴 BE-1 — Double-charge race on `/sessions/end`  ✅ Verified
`backend/routes/sessions.py:81-178`. The flow reads the session, checks `status != "active"`, then does the billing `UPDATE` — but that UPDATE has **no `WHERE status='active'` predicate** and there is **no row locking anywhere** (confirmed: zero `with_for_update`/`FOR UPDATE` in the codebase). Under READ COMMITTED, two concurrent `/end` calls (double-tap, mobile retry) both pass the check and both bill: student debited 2×, topper credited 2×, two transaction rows, `total_sessions += 2`.

**Fix:** make the transition the guard — `UPDATE ... WHERE session_id=? AND status='active'` and abort if `rowcount == 0`.

### 🔴 BE-2 — Lost-update race on wallet balance  ✅ Verified
`sessions.py:118-153` and `wallet.py:76-98` compute `new_balance = balance ± amount` **in Python** from a stale read, then write the literal back. The row lock serializes the writes but the second write overwrites with a stale-derived value → one update is silently lost. Ironically the codebase already does it correctly for `Topper.total_sessions` (`sessions.py:167-171`, atomic `total_sessions + 1`).

> **Scenario:** a topper on two calls ending together: balance 100 → one credits +30, other +18; final shows 118 or 130, never the correct 148. The `Transaction` rows still insert, so **balance and ledger become permanently inconsistent.**

**Fix:** do arithmetic in SQL — `.values(balance=Wallet.balance - amount)` — or `INSERT ... ON CONFLICT DO UPDATE SET balance = wallets.balance + :delta` (a pattern the team already uses in `user.py`/`mentor.py`).

### 🔴 BE-3 — Duplicate-payment guard is a race, unbacked by a constraint  ✅ Verified
`wallet.py:65-74` + live schema: `payment_id` has only `ix_transactions_payment_id` (btree), **not unique**. Two concurrent requests with the same `paymentId` (webhook retry, double-submit) both pass the pre-check and both credit. **Fix:** partial unique index on `payment_id WHERE payment_id IS NOT NULL`; catch `IntegrityError`.

### 🔴 BE-4 — Balance can go arbitrarily negative  ✅ Verified
`/start` checks `balance >= 50` once (`sessions.py:40`); `/end` charges the actual accrued amount with **no cap, no mid-call check, no `CHECK (balance >= 0)`**. Top up ₹50, talk 2 hours → `50 + (120-5)*10 = 1200` charged → balance `-1150`, a platform loss with no recovery path. Aggravated by **no limit on concurrent sessions** (BE, High) — one ₹50 balance can fund N simultaneous calls since each `/start` re-reads the same undecremented balance.

### 🟡 Money stored as `Float` (BE, Medium)  ✅ Verified
Live schema: `balance`, `amount_charged`, `topper_earns`, `platform_fee`, `amount`, `student_pays` are all `double precision`. Wrong type for a ledger; drift compounds with the read-modify-write races above. **Fix:** `NUMERIC(10,2)`. (The 60/40 split *rounding* itself was tested and is currently correct — the issue is the storage type.)

---

## 2. Authentication & authorization

### 🔴 FE-1 — Auth is a dead end  ✅ Verified
`frontend-react/src/lib/auth.js`: every sign-in (`signInWithGoogle/Email`, `signUpWithEmail`) rejects with "Auth not configured". These are the **only** paths that could write `tt_auth_token`. `auth-guard.js:isLoggedIn()` only checks `tt_user_uid`, so the UI can *look* logged-in while every API call throws "Not authenticated". **The entire backend is orphaned behind an unreachable frontend.**

### 🟠 SEC-4 — Unauthenticated writes to `/api/auth/event`  ✅ Verified
`backend/routes/events.py` has no `Depends(get_current_user)` and stores arbitrary client JSON into a JSONB column. I POSTed with **no token** → `200`, and confirmed the attacker-controlled row landed in the `events` table with null `user_id`. Unbounded + unauthenticated + unthrottled = storage-exhaustion / analytics-poisoning surface.

### 🟠 SEC-2 — ZEGO secret in the browser + unauthorized rooms  ✅ Verified
`frontend-react/src/lib/zego.js` hardcodes `ZEGO_APP_SIGN` (a real secret) — confirmed present verbatim in the compiled `build/static/js/main.*.js`. Room IDs derive from a route param with no server-side binding, and `getTopperUserID()` returns a static shared ID. Anyone can extract the secret, mint tokens, and join/hijack paid call rooms. **Fix:** mint short-lived ZEGO tokens server-side, bound to `session_id` + authenticated `uid`; rotate the leaked secret.

### 🟠 SEC-3 — Rate limiter is dead  ✅ Verified
`main.py` builds a `Limiter` and registers the handler but **never adds `SlowAPIMiddleware` and never uses `@limiter.limit`** (confirmed: neither appears anywhere). Live test: 130 requests in a burst against a 120/min limit → **zero 429s**. Every route is unthrottled, which also makes the double-submit races above easier to trigger. **Fix:** `app.add_middleware(SlowAPIMiddleware)`.

### Done right (verified, not over-reported)
- **IDOR is properly enforced** on sessions/ratings/reports (`uid != student_uid and uid != topper_id → 403`) and on topper status (`uid == topper_id`).
- **Firebase token verification is correct**: JWKS fetch + cache, RS256, audience + issuer + expiry checks; no `verify_signature=False`.
- **Charge amount is fully server-computed** (client never sends the price); `stars` bounded 1–5; `role`/`examMode` regex-allow-listed.
- **CORS is a true whitelist** (evil origin → 400, no wildcard-with-credentials) — verified live. **No SQL injection surface** (all queries parameterized). **No real secrets in git** (`.gitignore` hygiene correct).

---

## 3. Backend correctness (beyond money)

- 🟠 **BE-5 — No Topper ever created.** ✅ Verified: no `Topper(...)` construction in any route; `mentor.py` only writes a `pending` application and never promotes. So `/api/toppers` can't populate and `/sessions/start` always 404s "Topper not found" in practice — **the core paid-call flow is unreachable without manual SQL.**
- 🟠 **BE-6 — Wall-clock billing.** `time.time()` taken independently on the instances serving `/start` vs `/end`; cross-instance skew leaks into every bill, and a backward clock adjustment yields a negative duration persisted with no `CHECK`.
- 🟠 **BE-7 — Rating/report races & missing status check.** No unique constraint on `(session_id, from_uid)` or `(session_id, reported_by)`; `create_rating` never checks `status == 'completed'`, so you can rate an active/never-billed session.
- 🟠 **BE-8 — Cascade deletes the ledger.** ✅ Verified in schema: `users → wallets → transactions` all `ON DELETE CASCADE`; deleting a user erases their financial history (audit/compliance risk).
- 🟡 `Transaction.session_id` has no FK/index; `student_pays` duplicates `amount_charged`; `/start` has no role check (self-session possible).

### Done right (verified)
- **Within a single request, `/end` is atomic** (all writes on one session, one commit, rollback on error) — the bug is strictly *between* concurrent requests.
- **Reader/writer split is correct** — self-owned reads hit the primary; only public data uses the replica. No stale-read-after-write bug.
- **`prepared_statement_cache_size=0`** is the correct PgBouncer-transaction-mode fix. **`Wallet.uid` is PK** → structurally impossible to have two wallets. **Redis fails open.**

---

## 4. Frontend architecture

- 🔴 **FE-1** auth dead end (above).
- **~85% demo shell.** ~12 of 14 pages render hardcoded arrays and never call the API. The topper roster (`ALL_TOPPERS`/`TOPPERS`) is duplicated with differing shapes across HomePage, SearchPage, RandomPage, ChatPage, TopperProfilePage. Only WalletPage, ChatPage's session lifecycle, BecomeMentorPage submit, and TopperDashboard's online toggle call the real API.
- **Contract mismatches:** `WalletPage.js:41` `addMoney(finalAmount)` omits `paymentId`; `WalletPage.js:161` uses Firestore `tx.createdAt?.toDate` (backend sends ISO strings → blank dates); `BecomeMentorPage.js:178` always sends `phone: ""`.
- **Silent failures:** empty `catch {}` in WalletPage and ChatPage (`endSession`, `submitRating`) — money/rating ops can fail while the UI proceeds as success.
- **No route guards** in `App.js` — `/admin`, `/topper`, `/wallet` deep-linkable; `AdminPage` has no auth check at all (low risk *today* only because it's mock data).
- **Build health:** `react-scripts@5.0.1` (CRA, unmaintained); `protobufjs`/`long` had to be added manually for the Zego SDK to compile.

---

## 5. Infrastructure & deployment

- 🔴 **INF-1 — Compose doesn't boot.** ✅ (a) `6432:6432` mapping but the `edoburu/pgbouncer` image listens on **5432** internally → forwards to nothing; (b) `AUTH_TYPE: md5` fails against Postgres 16 (scram-sha-256) — `wrong password type`; (c) the healthcheck uses `wget`, absent from `python:3.12-slim`, so the container is *always* "unhealthy"; (d) `python main.py` spawns a reloader parent that survives a failed startup, so `docker ps` shows "Up" even when the app exited — the crash is masked.
- 🔴 **INF-2 — CI can never pass.** ✅ `ci.yml:105` runs `pytest tests/ -v`, but there is **no `tests/` dir, no test file, no conftest** anywhere. pytest exits 4 (path not found) → build/deploy never reached → CI has never caught INF-1.
- 🟠 **INF-3 — Dual schema management.** ✅ `main.py:72` runs `create_all()` at every startup *and* an Alembic migration exists that does 9 `create_index`es and `drop_constraint('users_email_key')`. On a fresh DB, `create_all()` builds tables with the naming-convention name `uq_users_email`, so the migration's drop of `users_email_key` targets a name that never existed → first `alembic upgrade head` errors. **Pick one:** drop `create_all()` and rely solely on Alembic.
- 🟠 **INF-4 — `reload=True` in prod.** ✅ `main.py:157` + `Dockerfile` CMD `python main.py` → filesystem-watching reloader, single worker, no gunicorn, and the reloader masks worker crashes (ties into INF-1d).
- 🟡 **Frontend has no deployment story** — no frontend Dockerfile/nginx/static config; it isn't in compose at all. Money columns as float; `reports` FKs unindexed; `/docs` always exposed (the `sys.argv[0]=="gunicorn"` guard never fires under `python main.py`); no backup story; single points of failure; reader engine is vestigial (no replica exists).

### ⚠️ Correction to earlier reports — the `cryptography` SIGILL
My earlier E2E report called this a crash that blocks the backend. On deeper analysis this is **most likely an Apple-Silicon/QEMU emulation artifact, not a production x86_64 risk**: RSA/JWT paths ran fine under emulation in the deep-dive, and pinning versions didn't change it — consistent with a QEMU CPU-feature-detection bug, not a `cryptography` version bug. **However**, `cryptography` genuinely *is* unpinned (floats to 49.0.0 via `python-jose[cryptography]`), which is a real reproducibility/supply-chain gap worth fixing regardless. Recommended framing: pin it for hygiene, and add a CI smoke job that boots `docker compose up` and hits `/health` on the native x86_64 GitHub runner before trusting it in prod.

### Done right
Multi-stage Dockerfile, non-root user, exec-form CMD; `/health` checks real PG+Redis connectivity; structured JSON logs + Sentry with PII stripped; deterministic Alembic naming convention; Redis-backed (shareable) limiter design; correct `.env`/secrets gitignore hygiene.

---

## 6. Recommended fix order

**P0 — money integrity & trust (do before any real launch):**
1. SEC-1: real server-side payment verification; never trust client `amount`.
2. BE-1/BE-2/BE-3: atomic SQL wallet math + `WHERE status='active'` transition guard + unique `payment_id`.
3. BE-4: fund holds + server-side call cap + `CHECK (balance >= 0)`; limit concurrent sessions.
4. Convert money columns to `NUMERIC`.

**P1 — make it actually runnable & safe:**
5. INF-1: fix PgBouncer port/auth + healthcheck tool; make startup failures crash the container.
6. INF-2: add a real test suite; add a compose-boot + `/health` smoke job to CI.
7. INF-3/INF-4: single schema mechanism (Alembic); `reload=False` + multi-worker.
8. FE-1: wire a real auth provider (or dev token issuer) so login yields a token.
9. BE-5: implement mentor-approval → `Topper` creation + role promotion.
10. SEC-2/SEC-3/SEC-4: server-side ZEGO tokens (+rotate secret); enable the rate-limit middleware; auth/bound/throttle the events endpoint.

**P2 — hardening & product:**
11. FE contract fixes (paymentId, date rendering, phone); replace empty `catch {}`; add route guards.
12. Wire the ~12 mock pages to the real API; length-bound free-text inputs; index `reports` FKs; stop cascade-deleting the ledger; gate `/docs`; add security headers/CSP; frontend deploy pipeline.

---

*All P0/P1 "Critical" and most "High" findings were re-verified live against the running stack. Items without a ✅ are high-confidence static findings from code review that I did not separately reproduce at runtime. No application source was modified during this analysis.*
