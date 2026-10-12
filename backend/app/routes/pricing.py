import math
from datetime import date
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc, asc, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import PricingRecord, PricingAuditLog
from app.schemas import (
    PricingRecordResponse,
    PricingRecordCreate,
    PricingRecordUpdate,
    PaginatedResponse,
    PricingAuditLogResponse
)

router = APIRouter(prefix="/pricing", tags=["Pricing Records"])


@router.get("", response_model=PaginatedResponse[PricingRecordResponse])
def search_pricing_records(
    store_id: Optional[str] = Query(None),
    sku: Optional[str] = Query(None),
    product_name: Optional[str] = Query(None),
    min_price: Optional[Decimal] = Query(None),
    max_price: Optional[Decimal] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    sort_by: str = Query("price_date", pattern="^(price_date|price|store_id|sku|product_name|updated_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = select(PricingRecord).options(joinedload(PricingRecord.audit_logs))

    if store_id:
        store_id_clean = store_id.strip()
        query = query.where(PricingRecord.store_id.ilike(f"%{store_id_clean}%"))
    if sku:
        sku_clean = sku.strip()
        query = query.where(PricingRecord.sku.ilike(f"%{sku_clean}%"))
    if product_name:
        prod_clean = product_name.strip()
        query = query.where(PricingRecord.product_name.ilike(f"%{prod_clean}%"))
    if min_price is not None:
        query = query.where(PricingRecord.price >= min_price)
    if max_price is not None:
        query = query.where(PricingRecord.price <= max_price)
    if start_date:
        query = query.where(PricingRecord.price_date >= start_date)
    if end_date:
        query = query.where(PricingRecord.price_date <= end_date)

    count_subquery = query.with_only_columns(func.count(PricingRecord.id)).order_by(None)
    total_records = db.execute(count_subquery).scalar() or 0

    sort_col = getattr(PricingRecord, sort_by, PricingRecord.price_date)
    order_expr = desc(sort_col) if sort_order.lower() == "desc" else asc(sort_col)
    query = query.order_by(order_expr)

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    results = db.execute(query).unique().scalars().all()
    total_pages = math.ceil(total_records / page_size) if total_records > 0 else 1

    return PaginatedResponse(
        items=results,
        total=total_records,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("", response_model=PricingRecordResponse, status_code=status.HTTP_201_CREATED)
def create_pricing_record(
    payload: PricingRecordCreate,
    db: Session = Depends(get_db)
):
    store_clean = payload.store_id.strip()
    sku_clean = payload.sku.strip()
    product_clean = payload.product_name.strip()

    existing = db.execute(
        select(PricingRecord).where(
            PricingRecord.store_id == store_clean,
            PricingRecord.sku == sku_clean,
            PricingRecord.price_date == payload.price_date
        )
    ).scalar_one_or_none()

    if existing:
        old_price = existing.price
        existing.price = payload.price
        existing.product_name = product_clean
        existing.currency = payload.currency.upper()
        if payload.source_file:
            existing.source_file = payload.source_file

        audit = PricingAuditLog(
            record_id=existing.id,
            store_id=existing.store_id,
            sku=existing.sku,
            old_price=old_price,
            new_price=payload.price,
            change_type="MANUAL_EDIT",
            reason="Created/updated via Web API",
            modified_by="Pricing Analyst"
        )
        db.add(audit)
        db.commit()
        db.refresh(existing)
        target_id = existing.id
    else:
        new_record = PricingRecord(
            store_id=store_clean,
            sku=sku_clean,
            product_name=product_clean,
            price=payload.price,
            currency=payload.currency.upper(),
            price_date=payload.price_date,
            source_file=payload.source_file or "Direct API Entry"
        )
        db.add(new_record)
        db.flush()

        audit = PricingAuditLog(
            record_id=new_record.id,
            store_id=new_record.store_id,
            sku=new_record.sku,
            old_price=None,
            new_price=new_record.price,
            change_type="INITIAL_CREATION",
            reason="Direct record creation via Web API",
            modified_by="Pricing Analyst"
        )
        db.add(audit)
        db.commit()
        db.refresh(new_record)
        target_id = new_record.id

    refreshed = db.execute(
        select(PricingRecord)
        .options(joinedload(PricingRecord.audit_logs))
        .where(PricingRecord.id == target_id)
    ).unique().scalar_one()

    return refreshed


@router.get("/stores/list", response_model=List[str])
def get_unique_stores(db: Session = Depends(get_db)):
    result = db.execute(
        select(PricingRecord.store_id).distinct().order_by(PricingRecord.store_id).limit(500)
    ).scalars().all()
    return list(result)


@router.get("/{record_id}", response_model=PricingRecordResponse)
def get_pricing_record_by_id(record_id: int, db: Session = Depends(get_db)):
    record = db.execute(
        select(PricingRecord)
        .options(joinedload(PricingRecord.audit_logs))
        .where(PricingRecord.id == record_id)
    ).unique().scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pricing record with ID {record_id} was not found."
        )
    return record


@router.put("/{record_id}", response_model=PricingRecordResponse)
def update_pricing_record(
    record_id: int,
    payload: PricingRecordUpdate,
    db: Session = Depends(get_db)
):
    record = db.execute(
        select(PricingRecord).where(PricingRecord.id == record_id)
    ).scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pricing record with ID {record_id} does not exist."
        )

    old_price = record.price
    new_price = payload.price

    record.price = new_price
    if payload.product_name:
        record.product_name = payload.product_name.strip()

    audit = PricingAuditLog(
        record_id=record.id,
        store_id=record.store_id,
        sku=record.sku,
        old_price=old_price,
        new_price=new_price,
        change_type="MANUAL_EDIT",
        reason=payload.reason or "Manual price edit via Web UI",
        modified_by=payload.modified_by or "Pricing Analyst"
    )
    db.add(audit)
    db.commit()
    db.refresh(record)

    refreshed = db.execute(
        select(PricingRecord)
        .options(joinedload(PricingRecord.audit_logs))
        .where(PricingRecord.id == record.id)
    ).unique().scalar_one()

    return refreshed


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pricing_record(record_id: int, db: Session = Depends(get_db)):
    record = db.execute(
        select(PricingRecord).where(PricingRecord.id == record_id)
    ).scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pricing record with ID {record_id} not found."
        )

    db.delete(record)
    db.commit()
    return None
