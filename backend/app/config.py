import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGO_URI: str
    MONGO_DB_NAME: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    MAX_UPLOAD_SIZE_MB: int = 100
    UPLOAD_DIR: str = "uploads"
    OPENAI_API_KEY: str = ""
    WHISPER_MODEL: str = "whisper-1"
    ANTHROPIC_API_KEY: str = ""
    SUMMARIZATION_MODEL: str = "claude-sonnet-4-6"
    MAX_PROCESSING_ATTEMPTS: int = 3
    PROCESSING_STALE_MINUTES: int = 30
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536
    USE_ATLAS_VECTOR_SEARCH: bool = False
    ATLAS_VECTOR_INDEX_NAME: str = "knowledge_embedding_index"
    LOCAL_VECTOR_CANDIDATE_LIMIT: int = 2000

    # Avatar & Multi-Model Gateway Settings
    PROJECT_NAME: str = "SETU — Knowledge Preservation Platform & AI Avatar"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "openai/gpt-4o-mini"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    GOOGLE_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GOOGLE_CSE_ID: str = ""
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "setu_knowledge"
    MAX_RESPONSE_WORDS: int = 400
    MAX_RESPONSE_SENTENCES: int = 15
    MEMORY_IMPORTANCE_THRESHOLD: float = 0.60
    DATA_DIR: Path = Path(__file__).parent.parent / "data"

    model_config = SettingsConfigDict(
        env_file=[
            str(Path(__file__).resolve().parent.parent / ".env"),
            ".env"
        ],
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)

