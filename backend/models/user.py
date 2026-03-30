from pydantic import BaseModel, Field
from typing import Optional


class UserProfileCreate(BaseModel):
    name: str
    role: str = Field(pattern=r"^(student|topper)$")
    examMode: str = Field(pattern=r"^(JEE|NEET)$")


class UserProfileResponse(BaseModel):
    uid: str
    name: str
    email: Optional[str] = None
    role: str
    examMode: str
    avatarUrl: Optional[str] = None
