import logging

from fastapi import APIRouter, Depends
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.mentor import MentorApplication
from orm_models import MentorApplication as MentorApplicationModel

_logger = logging.getLogger("toppertalks")

router = APIRouter(prefix="/api", tags=["mentor"])


@router.post("/mentor-apply")
async def apply_as_mentor(
    body: MentorApplication,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = user["uid"]

    stmt = (
        pg_insert(MentorApplicationModel)
        .values(
            applicant_id=uid,
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
        .on_conflict_do_update(
            index_elements=["applicant_id"],
            set_={
                "name": body.name,
                "phone": body.phone,
                "college": body.college,
                "branch": body.branch,
                "year": body.year,
                "exams": [e.model_dump() for e in body.exams],
                "subjects": body.subjects,
                "bio": body.bio,
                "status": "pending",
            },
        )
    )
    await db.execute(stmt)
    await db.commit()
    _logger.info('"Mentor application received — uid=%s"', uid)
    return {"success": True, "applicationId": uid}

