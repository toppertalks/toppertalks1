# TopperTalks Authentication Service

A production-ready Express + MongoDB authentication system for TopperTalks.

## Features
- JWT access + refresh tokens
- Secure password hashing with bcrypt
- Role-based authorization (user/admin)
- HTTP-only refresh cookies
- Rate limiting and secure headers
- Email verification flow
- Password reset flow
- Clean modular folder structure

## Quick Start

1. Install dependencies:
   ```bash
   cd auth-backend
   npm install
   ```

2. Copy `.env.example` to `.env` and fill values.

3. Start development server:
   ```bash
   npm run dev
   ```

4. Production start:
   ```bash
   npm start
   ```

## Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/request-password-reset`
- `POST /api/auth/reset-password`
- `GET /api/user/profile` (protected)
- `GET /api/user/admin/dashboard` (admin only)

## Notes

- Use environment variables for secrets and DB connection.
- Replace the email transport in `utils/email.js` with your provider credentials.
- Keep this service isolated from the existing TopperTalks Python backend.
