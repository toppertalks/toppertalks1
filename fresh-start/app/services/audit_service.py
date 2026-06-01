from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


class AuditService:
    """Persist security-relevant events. Failures must never break the request."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def log(
        self,
        *,
        event: str,
        user_id: Optional[uuid.UUID] = None,
        status: str = "success",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        meta: Optional[Dict[str, Any]] = None,
        commit: bool = True,
    ) -> None:
        try:
            entry = AuditLog(
                user_id=user_id,
                event=event,
                status=status,
                ip_address=ip_address,
                user_agent=user_agent,
                meta=meta,
            )
            self.db.add(entry)
            if commit:
                await self.db.commit()
        except Exception:  # pragma: no cover
            logger.exception("Failed to write audit log event=%s", event)
            try:
                await self.db.rollback()
            except Exception:
                pass
