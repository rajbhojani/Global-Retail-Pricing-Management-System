from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PricingRecord, UploadJob
from app.schemas import SystemStatsResponse, UploadJobResponse

router = APIRouter(prefix="/stats", tags=["System Statistics"])


@router.get("", response_model=SystemStatsResponse)
def get_system_statistics(db: Session = Depends(get_db)):
    total_records = db.execute(select(func.count(PricingRecord.id))).scalar() or 0
    active_stores = db.execute(select(func.count(func.distinct(PricingRecord.store_id)))).scalar() or 0
    unique_skus = db.execute(select(func.count(func.distinct(PricingRecord.sku)))).scalar() or 0

    price_stats = db.execute(
        select(
            func.avg(PricingRecord.price),
            func.min(PricingRecord.price),
            func.max(PricingRecord.price),
            func.min(PricingRecord.price_date),
            func.max(PricingRecord.price_date)
        )
    ).first()

    avg_price = Decimal(str(round(price_stats[0], 2))) if price_stats and price_stats[0] else None
    min_price = Decimal(str(price_stats[1])) if price_stats and price_stats[1] else None
    max_price = Decimal(str(price_stats[2])) if price_stats and price_stats[2] else None
    earliest_date = price_stats[3] if price_stats else None
    latest_date = price_stats[4] if price_stats else None

    recent_jobs = db.execute(
        select(UploadJob).order_by(UploadJob.created_at.desc()).limit(5)
    ).scalars().all()

    return SystemStatsResponse(
        total_records=total_records,
        active_stores_count=active_stores,
        unique_skus_count=unique_skus,
        avg_price=avg_price,
        min_price=min_price,
        max_price=max_price,
        earliest_price_date=earliest_date,
        latest_price_date=latest_date,
        recent_jobs=recent_jobs
    )
