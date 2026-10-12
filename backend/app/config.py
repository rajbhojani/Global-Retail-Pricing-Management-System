import os
import urllib.parse
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Global Retail Pricing Management System (RCPMS)"
    API_V1_STR: str = "/api/v1"
    
    SUPABASE_USER: str = "postgres.ygqqaxrhgkibssclgtau"
    SUPABASE_PASSWORD: str = "!Reatail22*"
    SUPABASE_POOLER_HOST: str = "aws-0-ap-northeast-1.pooler.supabase.com"
    SUPABASE_POOLER_PORT: int = 5432
    SUPABASE_DIRECT_HOST: str = "db.ygqqaxrhgkibssclgtau.supabase.co"
    SUPABASE_DB_NAME: str = "postgres"
    
    DATABASE_URL: str = ""

    INGESTION_BATCH_SIZE: int = 2000
    MAX_CSV_FILE_SIZE_MB: int = 50

    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "*"
    ]

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgresql://") and not self.DATABASE_URL.startswith("postgresql+psycopg2://"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
            return self.DATABASE_URL

        encoded_pwd = urllib.parse.quote_plus(self.SUPABASE_PASSWORD)
        return (
            f"postgresql+psycopg2://{self.SUPABASE_USER}:{encoded_pwd}"
            f"@{self.SUPABASE_POOLER_HOST}:{self.SUPABASE_POOLER_PORT}/{self.SUPABASE_DB_NAME}"
        )

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
