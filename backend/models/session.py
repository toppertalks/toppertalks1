from pydantic import BaseModel
from typing import Optional


class SessionStart(BaseModel):
    topperId: str


class SessionEnd(BaseModel):
    sessionId: str


class SessionReport(BaseModel):
    sessionId: str
    reason: str


class SessionResponse(BaseModel):
    sessionId: str
    studentUID: str
    topperId: str
    topperName: Optional[str] = None
    subject: Optional[str] = None
    callType: str = "video"
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    durationSeconds: int = 0
    amountCharged: float = 0
    studentPays: float = 0
    topperEarns: float = 0
    platformFee: float = 0
    status: str = "active"
