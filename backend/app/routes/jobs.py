from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import UploadJob
from app.schemas import UploadJobResponse

router = APIRouter(prefix="/jobs", tags=["Upload Jobs History"])


@router.get("", response_model=List[UploadJobResponse])
def get_upload_jobs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    jobs = db.execute(
        select(UploadJob).order_by(UploadJob.created_at.desc()).limit(limit)
    ).scalars().all()
    return jobs
