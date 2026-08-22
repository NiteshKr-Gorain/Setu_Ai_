from datetime import datetime
from typing import Literal, Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict

PyObjectId = Annotated[str, BeforeValidator(str)]

CategoryType = Literal[
    "Healthcare",
    "Agriculture",
    "Engineering",
    "Education",
    "Business",
    "Technology",
    "Traditional Knowledge"
]

class KnowledgeEntryCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    category: CategoryType
    community_id: Optional[str] = None

class KnowledgeEntryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[CategoryType] = None
    status: Optional[str] = None
    community_id: Optional[str] = None

class KnowledgeEntryOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    contributor_id: PyObjectId
    title: str
    description: str
    category: CategoryType
    status: Literal["draft", "uploaded", "processing", "completed", "failed"] = "draft"
    created_at: datetime
    updated_at: datetime
    content_type: Literal["text", "voice", "video", "document"] = "text"
    file_url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    key_insights: list[str] = []
    language: Optional[str] = None
    score: Optional[float] = None
    error_message: Optional[str] = None
    processing_stage: Optional[str] = None
    processing_attempts: int = 0
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    last_retry_at: Optional[datetime] = None
    trust_score: float = 0.0
    verification_count: int = 0
    community_id: Optional[PyObjectId] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )
