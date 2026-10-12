import csv
import io
import re
import time
import logging
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Generator, Tuple, List, Dict, Any, Optional

from sqlalchemy import text, func
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models import PricingRecord, PricingAuditLog, UploadJob
from app.config import settings

logger = logging.getLogger(__name__)


def normalize_header(header: str) -> str:
    cleaned = re.sub(r"[_\s\-]+", "", header.strip().lower())
    if cleaned in ("storeid", "store", "storecode"):
        return "store_id"
    if cleaned in ("sku", "skuid", "itemid", "itemcode", "barcode"):
        return "sku"
    if cleaned in ("productname", "product", "itemname", "name", "description"):
        return "product_name"
    if cleaned in ("price", "unitprice", "retailprice", "currentprice"):
        return "price"
    if cleaned in ("date", "pricedate", "effectivedate", "timestamp"):
        return "price_date"
    if cleaned in ("currency", "currencycode"):
        return "currency"
    return cleaned


def parse_date(value: str) -> Optional[date]:
    cleaned = value.strip()
    if not cleaned:
        return None
    
    formats = [
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%Y%m%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            continue
    return None


def parse_price(value: str) -> Optional[Decimal]:
    if not value:
        return None
    cleaned = re.sub(r"[\$,€,£,¥,\s]", "", str(value).strip())
    try:
        dec = Decimal(cleaned)
        if dec <= Decimal("0"):
            return None
        return round(dec, 2)
    except (InvalidOperation, ValueError):
        return None


class IngestionEngine:
    def __init__(self, db: Session, batch_size: int = settings.INGESTION_BATCH_SIZE):
        self.db = db
        self.batch_size = batch_size

    def process_csv_stream(
        self,
        file_obj: io.TextIOBase,
        filename: str,
        file_size_bytes: int = 0
    ) -> UploadJob:
        start_time = time.time()
        job = UploadJob(
            filename=filename,
            file_size_bytes=file_size_bytes,
            status="PROCESSING"
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        reader = csv.reader(file_obj)
        try:
            raw_headers = next(reader)
        except StopIteration:
            job.status = "FAILED"
            job.error_summary = "Uploaded CSV file is completely empty."
            job.completed_at = datetime.utcnow()
            self.db.commit()
            return job

        header_map = {}
        for idx, h in enumerate(raw_headers):
            normalized = normalize_header(h)
            header_map[normalized] = idx

        required_fields = ["store_id", "sku", "product_name", "price", "price_date"]
        missing_fields = [f for f in required_fields if f not in header_map]
        if missing_fields:
            job.status = "FAILED"
            job.error_summary = f"Missing mandatory columns: {', '.join(missing_fields)}. Headers detected: {raw_headers}"
            job.completed_at = datetime.utcnow()
            self.db.commit()
            return job

        batch_records: List[Dict[str, Any]] = []
        errors: List[str] = []
        total_rows = 0
        inserted_rows = 0
        updated_rows = 0
        error_rows = 0

        for line_num, row in enumerate(reader, start=2):
            if not row or all(col.strip() == "" for col in row):
                continue
            total_rows += 1

            try:
                store_id = row[header_map["store_id"]].strip() if len(row) > header_map["store_id"] else ""
                sku = row[header_map["sku"]].strip() if len(row) > header_map["sku"] else ""
                product_name = row[header_map["product_name"]].strip() if len(row) > header_map["product_name"] else ""
                raw_price = row[header_map["price"]].strip() if len(row) > header_map["price"] else ""
                raw_date = row[header_map["price_date"]].strip() if len(row) > header_map["price_date"] else ""
                currency = (
                    row[header_map["currency"]].strip().upper()
                    if "currency" in header_map and len(row) > header_map["currency"]
                    else "USD"
                ) or "USD"

                if not store_id:
                    raise ValueError("Store ID is empty")
                if not sku:
                    raise ValueError("SKU is empty")
                if not product_name:
                    raise ValueError("Product Name is empty")

                price = parse_price(raw_price)
                if price is None:
                    raise ValueError(f"Invalid positive price: '{raw_price}'")

                price_date = parse_date(raw_date)
                if price_date is None:
                    raise ValueError(f"Invalid date format: '{raw_date}'")

                batch_records.append({
                    "store_id": store_id,
                    "sku": sku,
                    "product_name": product_name,
                    "price": price,
                    "currency": currency,
                    "price_date": price_date,
                    "source_file": filename
                })

            except Exception as e:
                error_rows += 1
                if len(errors) < 25:
                    errors.append(f"Row {line_num}: {str(e)}")

            if len(batch_records) >= self.batch_size:
                ins, upd = self._flush_batch(batch_records)
                inserted_rows += ins
                updated_rows += upd
                batch_records = []

        if batch_records:
            ins, upd = self._flush_batch(batch_records)
            inserted_rows += ins
            updated_rows += upd

        duration = int((time.time() - start_time) * 1000)
        job.total_rows = total_rows
        job.inserted_rows = inserted_rows
        job.updated_rows = updated_rows
        job.error_rows = error_rows
        job.duration_ms = duration
        job.status = "COMPLETED" if error_rows < total_rows else "FAILED"
        if errors:
            job.error_summary = "\n".join(errors) + (f"\n...and {error_rows - len(errors)} more errors." if error_rows > len(errors) else "")
        job.completed_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(job)
        return job

    def _flush_batch(self, records: List[Dict[str, Any]]) -> Tuple[int, int]:
        if not records:
            return 0, 0

        unique_map: Dict[Tuple[str, str, date], Dict[str, Any]] = {}
        for r in records:
            key = (r["store_id"], r["sku"], r["price_date"])
            unique_map[key] = r
        deduped_records = list(unique_map.values())

        stmt = pg_insert(PricingRecord).values(deduped_records)
        upsert_stmt = stmt.on_conflict_do_update(
            index_elements=["store_id", "sku", "price_date"],
            set_={
                "price": stmt.excluded.price,
                "product_name": stmt.excluded.product_name,
                "currency": stmt.excluded.currency,
                "source_file": stmt.excluded.source_file,
                "updated_at": func.now()
            }
        ).returning(PricingRecord.id, text("(xmax = 0) AS is_inserted"))

        result = self.db.execute(upsert_stmt)
        inserted_count = 0
        updated_count = 0

        for row in result:
            is_inserted = bool(row[1])
            if is_inserted:
                inserted_count += 1
            else:
                updated_count += 1

        self.db.commit()
        return inserted_count, updated_count
