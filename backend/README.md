# TopperTalks Backend

FastAPI backend for the TopperTalks platform.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Place your Firebase service account key JSON file in the `backend/` folder as `serviceAccountKey.json`.
   - Go to Firebase Console → Project Settings → Service Accounts → Generate New Private Key

## Run

```bash
python main.py
```

Server starts at `http://localhost:4000` with auto-reload.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/toppers` | List toppers (filter by `?exam=JEE`) |
| GET | `/api/toppers/{id}` | Get topper profile |
| PATCH | `/api/toppers/{id}/status` | Update online status |
| POST | `/api/sessions/start` | Start a call session |
| POST | `/api/sessions/end` | End session & calculate charges |
| POST | `/api/sessions/report` | Report session misconduct |
| GET | `/api/sessions` | Session history (`?role=student`) |
| GET | `/api/wallet` | Get balance & transactions |
| POST | `/api/wallet` | Add money to wallet |
| POST | `/api/ratings` | Submit a rating |
| GET | `/api/ratings` | Get topper's ratings (`?topperId=`) |
| GET | `/api/user/profile` | Get user profile |
| POST | `/api/user/profile` | Create/update profile |
| POST | `/api/mentor-apply` | Submit mentor application |
| POST | `/api/auth/event` | Log activity event |
| GET | `/health` | Health check |

All endpoints (except health) require `Authorization: Bearer <Firebase ID Token>`.
