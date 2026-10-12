import uuid
from sqlalchemy import (
    Column,
    String,
    Numeric,
    Date,
    DateTime,
    BigInteger,
    Integer,
    Text,
    ForeignKey,
    UniqueConstraint,
    Index,
    func
)
from sqlalchemy.orm import relationship
from app.database import Base


class PricingRecord(Base):
    __tablename__ = "pricing_records"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(String(50), nullable=False, index=True)
    sku = Column(String(100), nullable=False, index=True)
    product_name = Column(String(255), nullable=False, index=True)
    price = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    price_date = Column(Date, nullable=False, index=True)
    source_file = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    audit_logs = relationship("PricingAuditLog", back_populates="record", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("store_id", "sku", "price_date", name="uq_store_sku_date"),
        Index("ix_pricing_search_store_date", "store_id", "price_date"),
        Index("ix_pricing_sku_store", "sku", "store_id"),
        Index("ix_pricing_date_price", "price_date", "price"),
    )


class PricingAuditLog(Base):
    __tablename__ = "pricing_audit_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    record_id = Column(BigInteger, ForeignKey("pricing_records.id", ondelete="CASCADE"), nullable=True, index=True)
    store_id = Column(String(50), nullable=False, index=True)
    sku = Column(String(100), nullable=False, index=True)
    old_price = Column(Numeric(12, 2), nullable=True)
    new_price = Column(Numeric(12, 2), nullable=False)
    change_type = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    modified_by = Column(String(100), default="Pricing Analyst", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    record = relationship("PricingRecord", back_populates="audit_logs")


class UploadJob(Base):
    __tablename__ = "upload_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(BigInteger, default=0, nullable=False)
    status = Column(String(30), default="PENDING", index=True, nullable=False)
    total_rows = Column(Integer, default=0, nullable=False)
    inserted_rows = Column(Integer, default=0, nullable=False)
    updated_rows = Column(Integer, default=0, nullable=False)
    error_rows = Column(Integer, default=0, nullable=False)
    error_summary = Column(Text, nullable=True)
    duration_ms = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
