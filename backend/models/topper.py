from pydantic import BaseModel
from typing import Optional


class TopperResponse(BaseModel):
    uid: str
    name: str
    college: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    rank: Optional[str] = None
    examCleared: Optional[str] = None
    subjects: list[str] = []
    bio: Optional[str] = None
    rating: float = 0.0
    totalSessions: int = 0
    isOnline: bool = False
    avatarUrl: Optional[str] = None


class TopperStatusUpdate(BaseModel):
    isOnline: bool
