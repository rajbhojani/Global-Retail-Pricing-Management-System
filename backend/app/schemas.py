from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Generic, TypeVar
from pydantic import BaseModel, Field, field_validator, ConfigDict

T = TypeVar("T")


class PricingRecordBase(BaseModel):
    store_id: str = Field(..., min_length=1, max_length=50, description="Store ID, e.g. STORE-001 or US-101")
    sku: str = Field(..., min_length=1, max_length=100, description="Stock Keeping Unit code")
    product_name: str = Field(..., min_length=1, max_length=255, description="Full product name")
    price: Decimal = Field(..., gt=0, decimal_places=2, description="Product price must be greater than zero")
    currency: str = Field(default="USD", max_length=10, description="ISO Currency code")
    price_date: date = Field(..., description="Effective price date (YYYY-MM-DD)")


class PricingRecordCreate(PricingRecordBase):
    source_file: Optional[str] = None


class PricingRecordUpdate(BaseModel):
    price: Decimal = Field(..., gt=0, decimal_places=2, description="Updated price must be strictly positive")
    product_name: Optional[str] = Field(None, min_length=1, max_length=255)
    reason: Optional[str] = Field("Manual price revision", max_length=500)
    modified_by: Optional[str] = Field("Pricing Analyst", max_length=100)

    @field_validator("price")
    @classmethod
    def validate_positive_price(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Price must be greater than zero.")
        return round(v, 2)


class PricingAuditLogResponse(BaseModel):
    id: int
    record_id: Optional[int]
    store_id: str
    sku: str
    old_price: Optional[Decimal]
    new_price: Decimal
    change_type: str
    reason: Optional[str]
    modified_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PricingRecordResponse(PricingRecordBase):
    id: int
    source_file: Optional[str]
    created_at: datetime
    updated_at: datetime
    audit_logs: List[PricingAuditLogResponse] = []

    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class PricingSearchParams(BaseModel):
    store_id: Optional[str] = None
    sku: Optional[str] = None
    product_name: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    sort_by: str = "price_date"
    sort_order: str = "desc"
    page: int = 1
    page_size: int = 25


class UploadJobResponse(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    status: str
    total_rows: int
    inserted_rows: int
    updated_rows: int
    error_rows: int
    error_summary: Optional[str]
    duration_ms: int
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class SystemStatsResponse(BaseModel):
    total_records: int
    active_stores_count: int
    unique_skus_count: int
    avg_price: Optional[Decimal]
    min_price: Optional[Decimal]
    max_price: Optional[Decimal]
    latest_price_date: Optional[date]
    earliest_price_date: Optional[date]
    recent_jobs: List[UploadJobResponse] = []
