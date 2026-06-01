from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import bearer_scheme
from app.core.security import decode_token
from app.db.session import get_db
from app.models.event import Event

router = APIRouter(prefix="/events", tags=["events"])


class EventBody(BaseModel):
    event: str
    timestamp: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


@router.post("")
async def log_event(
    body: EventBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Best-effort event logger. Auth is optional."""
    user_id = None
    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        try:
            payload = decode_token(auth.split(" ", 1)[1], expected_type="access")
            sub = payload.get("sub")
            if sub:
                import uuid as _uuid
                user_id = _uuid.UUID(sub)
        except Exception:
            user_id = None

    db.add(Event(
        user_id=user_id,
        event=body.event,
        event_metadata=body.metadata,
        client_timestamp=body.timestamp,
    ))
    await db.commit()
    return {"ok": True}
