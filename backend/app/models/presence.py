"""
Pydantic Models for Live User State & Presence.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class HeartbeatIn(BaseModel):
    """Payload sent by client during periodic heartbeat or activity transition."""
    status: Optional[str] = Field(default="active", description="User status: active, idle, offline")
    current_activity: Optional[str] = Field(default=None, description="Current user activity (e.g., 'browsing_library', 'reading_passport')")
    current_resource: Optional[str] = Field(default=None, description="Identifier or name of active resource")
    session_id: Optional[str] = Field(default=None, description="Client session or tab identifier")

class UserStateOut(BaseModel):
    """Resolved presence state returned to clients."""
    user_id: str
    status: str = Field(description="Resolved status: active, idle, offline")
    raw_status: Optional[str] = Field(default=None, description="Stored database status before staleness check")
    current_activity: Optional[str] = None
    current_resource: Optional[str] = None
    session_id: Optional[str] = None
    last_confirmed_at: Optional[str] = Field(default=None, description="ISO timestamp of last backend-confirmed heartbeat")
    freshness: str = Field(description="Human-readable freshness string (e.g. 'just now', '45s ago')")
    is_stale: bool = Field(description="True if state exceeded STALE_THRESHOLD_SECONDS")
    seconds_since_confirmed: Optional[float] = None

class HeartbeatResponse(BaseModel):
    """Response returned by POST /api/state/heartbeat."""
    success: bool = True
    resolved_state: UserStateOut

class ActiveUsersResponse(BaseModel):
    """Response containing all currently active and idle users."""
    total_active_count: int
    active_users: List[UserStateOut]
