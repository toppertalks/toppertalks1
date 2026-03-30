# =============================================================================
# Multi-stage build — keeps the final image lean and secure.
#
# Stage 1 (builder): installs Python dependencies into an isolated prefix.
# Stage 2 (runtime): copies only the installed packages + app code.
#   - No build tools (pip, gcc, etc.) are present in the final image.
#   - Runs as a non-root user (appuser) — industry-standard container hardening.
# =============================================================================

# ── Stage 1: dependency builder ───────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /install

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install/deps -r requirements.txt


# ── Stage 2: runtime image ────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Create a non-root user — never run production services as root.
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /install/deps /usr/local

# Copy application code
COPY backend/ ./

# Set ownership so the non-root user can write nothing outside /app
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 4000

# Use exec form (not shell form) so SIGTERM reaches uvicorn directly,
# enabling graceful shutdown of in-flight requests.
CMD ["python", "main.py"]
