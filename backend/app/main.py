import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, get_db, init_db
from app.routes import pricing, upload, stats, jobs

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("retail-pricing-app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Retail Pricing Management Engine...")
    try:
        init_db()
        logger.info("Database initialized and ready.")
    except Exception as e:
        logger.error(f"Failed to initialize database on startup: {e}")
    yield
    logger.info("Shutting down Retail Pricing Management Engine...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time-Ms"] = str(round(process_time * 1000, 2))
    return response


@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    start = time.time()
    try:
        db.execute(text("SELECT 1")).scalar()
        latency_ms = round((time.time() - start) * 1000, 2)
        return {
            "status": "healthy",
            "database": "connected",
            "latency_ms": latency_ms,
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "version": "1.0.0"
        }


@app.get("/", tags=["Root"])
def root_info():
    return {
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_prefix": settings.API_V1_STR,
        "health": "/api/health"
    }


app.include_router(pricing.router, prefix=settings.API_V1_STR)
app.include_router(upload.router, prefix=settings.API_V1_STR)
app.include_router(stats.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)

