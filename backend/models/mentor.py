from pydantic import BaseModel
from typing import Optional


class ExamDetail(BaseModel):
    exam: str
    rank: str


class MentorApplication(BaseModel):
    name: str
    phone: str
    college: str
    branch: Optional[str] = None
    year: Optional[str] = None
    exams: list[ExamDetail]
    subjects: list[str]
    bio: str
