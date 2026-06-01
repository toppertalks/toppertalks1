from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.mentor import MentorApplication
from app.models.user import User

router = APIRouter(tags=["mentor"])


class ExamDetail(BaseModel):
    exam: str
    rank: str = ""


class MentorApplicationBody(BaseModel):
    name: str
    phone: str
    college: str
    branch: str | None = None
    year: str | None = None
    exams: list[ExamDetail] = []
    subjects: list[str] = []
    bio: str


@router.post("/mentor-apply")
async def apply_as_mentor(
    body: MentorApplicationBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    values = dict(
        applicant_id=user.id,
        name=body.name,
        phone=body.phone,
        college=body.college,
        branch=body.branch,
        year=body.year,
        exams=[e.model_dump() for e in body.exams],
        subjects=body.subjects,
        bio=body.bio,
        status="pending",
    )
    stmt = insert(MentorApplication).values(**values).on_conflict_do_update(
        index_elements=["applicant_id"],
        set_={k: v for k, v in values.items() if k != "applicant_id"},
    )
    await db.execute(stmt)
    await db.commit()
    return {"success": True, "applicationId": str(user.id)}
