from fastapi import APIRouter, Request
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from database import get_db
from orm_models import Event

router = APIRouter(prefix="/api/auth", tags=["events"])


@router.post("/event")
async def log_event(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    uid = None
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        # Best-effort: extract uid if token is parseable (no hard failure)
        try:
            from auth import get_current_user
            from fastapi.security import HTTPAuthorizationCredentials
            token = auth_header.split(" ", 1)[1]
            creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
            user = await get_current_user(creds)
            uid = user.get("uid")
        except Exception:
            pass

    try:
        body = await request.json()
    except Exception:
        body = {}

    db.add(
        Event(
            user_id=uid,
            event=body.get("event", "unknown"),
            event_metadata={k: v for k, v in body.items() if k not in ("event", "timestamp")},
            timestamp=body.get("timestamp"),
        )
    )
    await db.commit()
    return {"ok": True}
