"""
Real-time communication endpoints.

Routes
------
POST /rtc/initiate           Student starts a call -> creates CallSession (status="ringing")
POST /rtc/join               Either party fetches a LiveKit token for the session room
WS   /rtc/ws/{session_id}    Signaling channel (auth via ?token=<access_jwt>)

Signaling event shape (JSON)
----------------------------
{ "type": "STUDENT_JOINED" | "MENTOR_JOINED" | "CALL_ACCEPTED"
        | "CALL_REJECTED"  | "CALL_ENDED"    | "CHAT" | "PING",
  "userId": "<uuid>",
  "payload": { ...optional }
}
"""
from __future__ import annotations

import time
import uuid
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.security import decode_token
from app.db.session import AsyncSessionLocal, get_db
from app.models.session import CallSession
from app.models.user import User
from app.services.connection_manager import manager
from app.services.livekit_service import build_room_name, issue_livekit_token

router = APIRouter(prefix="/rtc", tags=["rtc"])


# ---------- REST models ---------------------------------------------------

class InitiateBody(BaseModel):
    # Accept a string so demo ids like "1".. "5" work alongside real UUIDs.
    topperId: str
    mode: Literal["voice", "video"] = "video"


class InitiateResponse(BaseModel):
    sessionId: str
    roomName: str
    mode: str
    topperName: str


class JoinBody(BaseModel):
    sessionId: uuid.UUID


class JoinResponse(BaseModel):
    sessionId: str
    roomName: str
    livekitUrl: Optional[str]
    livekitToken: Optional[str]
    role: Literal["student", "topper"]


# ---------- Helpers -------------------------------------------------------

async def _load_session_for_user(
    db: AsyncSession, session_id: uuid.UUID, user: User
) -> CallSession:
    sess = await db.get(CallSession, session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    if user.id not in (sess.student_uid, sess.topper_id) and not user.is_superuser:
        raise HTTPException(status_code=403, detail="Not a participant")
    return sess


# ---------- REST endpoints ------------------------------------------------

@router.post("/initiate", response_model=InitiateResponse)
async def initiate_call(
    body: InitiateBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Student creates a pending call session and the system 'rings' the topper."""
    topper_user: Optional[User] = None

    # 1. If a valid UUID was sent, try direct lookup.
    try:
        topper_uuid = uuid.UUID(body.topperId)
        topper_user = await db.get(User, topper_uuid)
    except ValueError:
        topper_user = None

    # 2. Demo fallback: id like "1".. "5" -> pick ANY other user (so frontend
    #    mock data still works against a real DB). Remove this once the
    #    frontend lists real toppers from /api/v1/toppers.
    if topper_user is None:
        stmt = (
            select(User)
            .where(User.id != user.id, User.is_active.is_(True))
            .limit(1)
        )
        topper_user = (await db.execute(stmt)).scalars().first()

    if topper_user is None:
        raise HTTPException(status_code=404, detail="Topper not found")
    if topper_user.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot call yourself")

    sess = CallSession(
        session_id=uuid.uuid4(),
        student_uid=user.id,
        topper_id=topper_user.id,
        topper_name=topper_user.full_name or topper_user.email,
        start_time=time.time(),
        status="ringing",
    )
    db.add(sess)
    await db.commit()

    # Tell anyone already subscribed for this topper's incoming ring.
    # (Topper subscribes to ws/user/{uid} in a future improvement; for now
    # the topper's UI polls /rtc/incoming or opens the call screen directly.)
    return InitiateResponse(
        sessionId=str(sess.session_id),
        roomName=build_room_name(str(sess.session_id)),
        mode=body.mode,
        topperName=sess.topper_name or "",
    )


@router.post("/join", response_model=JoinResponse)
async def join_call(
    body: JoinBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Either party requests a LiveKit token to enter the room."""
    sess = await _load_session_for_user(db, body.sessionId, user)
    if sess.status in {"completed", "reported"}:
        raise HTTPException(status_code=410, detail="Session already ended")

    role: Literal["student", "topper"] = "topper" if sess.topper_id == user.id else "student"
    token = issue_livekit_token(
        session_id=str(sess.session_id),
        user_id=str(user.id),
        user_name=user.full_name or user.email or str(user.id),
    )
    from app.core.config import settings  # local import to avoid cycles at module load
    return JoinResponse(
        sessionId=str(sess.session_id),
        roomName=build_room_name(str(sess.session_id)),
        livekitUrl=settings.LIVEKIT_URL or None,
        livekitToken=token,
        role=role,
    )


# ---------- WebSocket signaling ------------------------------------------

async def _authenticate_ws(token: str) -> Optional[uuid.UUID]:
    """Decode JWT from query string. Returns user id or None."""
    try:
        payload = decode_token(token, expected_type="access")
    except JWTError:
        return None
    sub = payload.get("sub")
    if not sub:
        return None
    try:
        return uuid.UUID(sub)
    except ValueError:
        return None


@router.websocket("/ws/{session_id}")
async def signaling_socket(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(..., description="Access JWT"),
):
    # 1. Authenticate
    user_id = await _authenticate_ws(token)
    if user_id is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Authorize - must be participant of this session
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    async with AsyncSessionLocal() as db:
        sess = await db.get(CallSession, sid)
        if not sess or user_id not in (sess.student_uid, sess.topper_id):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        role = "topper" if sess.topper_id == user_id else "student"

    # 3. Accept + register
    await websocket.accept()
    await manager.connect(session_id, str(user_id), websocket)

    # Tell the OTHER side that this user joined.
    join_event_type = "MENTOR_JOINED" if role == "topper" else "STUDENT_JOINED"
    await manager.broadcast(
        session_id,
        {"type": join_event_type, "userId": str(user_id), "role": role},
        exclude=websocket,
    )
    # Also tell the joiner who else is already in the room.
    others = await manager.participants(session_id)
    others.discard(str(user_id))
    await websocket.send_json(
        {"type": "ROOM_STATE", "participants": list(others), "you": str(user_id)}
    )

    try:
        while True:
            data = await websocket.receive_json()
            evt_type = data.get("type")
            if evt_type == "PING":
                await websocket.send_json({"type": "PONG"})
                continue

            # Stamp the sender and forward to the other party.
            data["userId"] = str(user_id)
            data["role"] = role
            await manager.broadcast(session_id, data, exclude=websocket)

    except WebSocketDisconnect:
        pass
    except Exception:
        # Don't leak errors to the client; just clean up.
        pass
    finally:
        await manager.disconnect(session_id, websocket)
        await manager.broadcast(
            session_id,
            {"type": "PARTICIPANT_LEFT", "userId": str(user_id), "role": role},
        )
