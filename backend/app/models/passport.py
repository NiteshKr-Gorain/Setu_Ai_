from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict
from app.models.knowledge_entry import PyObjectId

class PassportSummaryOut(BaseModel):
    passport_id: str
    entry_id: PyObjectId = Field(..., alias="entry_id")
    version_number: int
    content_hash: str
    trust_score: float
    verification_count: int

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class KnowledgeVersionOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    entry_id: PyObjectId
    version_number: int
    title: str
    description: str
    content_hash: str
    previous_hash: Optional[str] = None
    changed_by: PyObjectId
    created_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class AuditTimelineEventOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    entry_id: PyObjectId
    event_type: Literal["CREATED", "REVISED", "VERIFIED", "REJECTED", "PEER_REVIEWED"]
    actor_id: PyObjectId
    actor_name: str
    description: str
    metadata: Optional[dict] = None
    created_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class IntegrityVerificationOut(BaseModel):
    verified: bool
    computed_hash: str
    stored_hash: str
    version_number: int
    message: str

VerificationStatus = Literal["unverified", "verified", "flagged"]

class ActivityLogEntry(BaseModel):
    action: str
    actor: str
    timestamp: datetime

class ProvenanceSubObject(BaseModel):
    source: str
    created_by: PyObjectId
    modified_by: PyObjectId
    verified_by: Optional[PyObjectId] = None
    activity_log: List[ActivityLogEntry] = []

class KnowledgeVersionCreate(BaseModel):
    article_id: str
    content: str
    change_summary: str = "Initial version"
    citations: List[str] = []
    source: str = "web"

class KnowledgeVersionDetailOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    article_id: PyObjectId
    version_number: int
    content: str
    sha256_hash: str
    created_by: PyObjectId
    modified_by: PyObjectId
    created_at: datetime
    modified_at: datetime
    change_summary: str
    verification_status: VerificationStatus
    citations: List[str]
    source: str
    provenance: Optional[ProvenanceSubObject] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class KnowledgeVersionHistoryOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    article_id: PyObjectId
    version_number: int
    sha256_hash: str
    created_by: PyObjectId
    modified_by: PyObjectId
    created_at: datetime
    modified_at: datetime
    change_summary: str
    verification_status: VerificationStatus
    citations: List[str]
    source: str
    provenance: Optional[ProvenanceSubObject] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class ProvenanceChainOut(BaseModel):
    article_id: PyObjectId
    version_number: int
    created_by: str
    modified_by: str
    verified_by: Optional[str] = None
    citations: List[str]
    activity_log: List[ActivityLogEntry]

