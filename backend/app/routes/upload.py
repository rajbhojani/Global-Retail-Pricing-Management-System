import io
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.ingestion import IngestionEngine, normalize_header, parse_price, parse_date
from app.schemas import UploadJobResponse
from app.config import settings

router = APIRouter(prefix="/upload", tags=["Feed Ingestion"])


@router.post("", response_model=UploadJobResponse, status_code=status.HTTP_201_CREATED)
async def upload_pricing_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV (.csv) files are supported."
        )

    content = await file.read()
    file_size = len(content)

    max_bytes = settings.MAX_CSV_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_CSV_FILE_SIZE_MB}MB."
        )

    try:
        decoded_text = content.decode("utf-8")
    except UnicodeDecodeError:
        decoded_text = content.decode("latin-1")

    text_stream = io.StringIO(decoded_text)
    engine = IngestionEngine(db=db)
    job = engine.process_csv_stream(
        file_obj=text_stream,
        filename=file.filename,
        file_size_bytes=file_size
    )

    return job


@router.post("/preview")
async def preview_csv_feed(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file."
        )

    content = await file.read(64 * 1024)
    try:
        sample_text = content.decode("utf-8")
    except UnicodeDecodeError:
        sample_text = content.decode("latin-1")

    import csv
    reader = csv.reader(io.StringIO(sample_text))
    try:
        headers = next(reader)
    except StopIteration:
        return {"headers": [], "preview_rows": [], "detected_mapping": {}}

    detected_mapping = {h: normalize_header(h) for h in headers}
    preview_rows: List[Dict[str, Any]] = []

    for row in reader:
        if not row or all(c.strip() == "" for c in row):
            continue
        row_dict = {}
        for idx, h in enumerate(headers):
            val = row[idx].strip() if idx < len(row) else ""
            row_dict[h] = val
        preview_rows.append(row_dict)
        if len(preview_rows) >= 5:
            break

    return {
        "headers": headers,
        "detected_mapping": detected_mapping,
        "preview_rows": preview_rows
    }
