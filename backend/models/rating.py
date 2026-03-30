from pydantic import BaseModel, Field
from typing import Optional


class RatingCreate(BaseModel):
    sessionId: str
    stars: int = Field(ge=1, le=5)
    comment: str = ""


class RatingResponse(BaseModel):
    ratingId: str
    sessionId: str
    fromUID: str
    toUID: str
    stars: int
    comment: str
    createdAt: Optional[str] = None
