"""
In-memory WebSocket connection manager for call signaling.

Each call/session has its own "room" (keyed by session_id). Both the
student and the mentor connect to that room over a WebSocket. The
manager keeps track of who is connected and broadcasts events to the
other participant.

PRODUCTION NOTE
---------------
This stores connections in a Python dict, which only works for a
single FastAPI process. To scale horizontally:

    publish  -> Redis PUBLISH ws:{session_id}
    receive  -> each pod SUBSCRIBES and forwards to its local sockets

The public methods below (connect/disconnect/broadcast/send_personal)
are the only surface other code touches, so a Redis backend is a
drop-in replacement.
"""
from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any, Dict, List, Set

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        # session_id -> list of (websocket, user_id)
        self._rooms: Dict[str, List[tuple[WebSocket, str]]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def connect(self, session_id: str, user_id: str, websocket: WebSocket) -> None:
        """WebSocket must already be accepted by the caller."""
        async with self._lock:
            self._rooms[session_id].append((websocket, user_id))

    async def disconnect(self, session_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            conns = self._rooms.get(session_id, [])
            self._rooms[session_id] = [(ws, uid) for (ws, uid) in conns if ws is not websocket]
            if not self._rooms[session_id]:
                self._rooms.pop(session_id, None)

    async def participants(self, session_id: str) -> Set[str]:
        async with self._lock:
            return {uid for (_, uid) in self._rooms.get(session_id, [])}

    async def broadcast(
        self,
        session_id: str,
        message: Dict[str, Any],
        *,
        exclude: WebSocket | None = None,
    ) -> None:
        """Send `message` (JSON) to everyone in the room, optionally skipping one socket."""
        dead: List[WebSocket] = []
        # Snapshot the list under the lock, then send without holding it.
        async with self._lock:
            targets = list(self._rooms.get(session_id, []))

        for ws, _uid in targets:
            if ws is exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)

        for ws in dead:
            await self.disconnect(session_id, ws)


manager = ConnectionManager()
