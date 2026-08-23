"""
Pydantic Models for Setu Admin Moderation, Access Control, and Governance.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from app.models.user import PyObjectId

class AdminOverviewOut(BaseModel):
    """Platform-wide summary KPIs for the Admin Command Center."""
    total_knowledge_entries: int = 0
    pending_review_entries: int = 0
    published_entries: int = 0
    rejected_entries: int = 0
    total_users: int = 0
    active_contributors: int = 0
    verified_mentors: int = 0
    total_communities: int = 0
    total_rfid_tags: int = 0
    recent_activity: List[Dict[str, Any]] = []

class AdminKnowledgeItemOut(BaseModel):
    """Knowledge entry item with expanded contributor details for moderation."""
    id: str = Field(..., alias="_id")
    title: str
    description: str
    category: str
    status: str
    content_type: str = "text"
    contributor_id: str
    contributor_name: str = "Unknown Contributor"
    contributor_email: str = ""
    passport_id: Optional[str] = None
    trust_score: Optional[float] = 0.0
    verification_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime
    moderation_note: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class AdminKnowledgeStatusUpdateIn(BaseModel):
    """Payload to approve, reject, or change moderation status of a knowledge post."""
    status: Literal["completed", "draft", "rejected", "failed"]
    moderation_note: Optional[str] = Field(default=None, max_length=500)
    trust_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)

class AdminUserItemOut(BaseModel):
    """User profile record with permission flags for admin access control."""
    id: str = Field(..., alias="_id")
    name: str
    email: str = ""
    role: str
    preferred_language: str = "en"
    can_post: bool = True
    can_create_community: bool = True
    is_active: bool = True
    is_verified_mentor: bool = False
    rfid_card_uid: Optional[str] = None
    knowledge_count: int = 0
    created_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class AdminUserPermissionsUpdateIn(BaseModel):
    """Payload to update user permissions, posting rights, or role."""
    role: Optional[Literal["contributor", "learner", "both", "admin"]] = None
    can_post: Optional[bool] = None
    can_create_community: Optional[bool] = None
    is_active: Optional[bool] = None
    is_verified_mentor: Optional[bool] = None
    preferred_language: Optional[str] = None

class AdminCommunityItemOut(BaseModel):
    """Community record with admin moderation metadata."""
    id: str = Field(..., alias="_id")
    name: str
    description: str
    category: str
    visibility: str
    admin_id: str
    admin_name: Optional[str] = "Community Admin"
    members_count: int = 1
    is_featured: bool = False
    created_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class AdminActionResponse(BaseModel):
    """Standard success response for admin governance actions."""
    success: bool = True
    message: str
    details: Optional[Dict[str, Any]] = None
