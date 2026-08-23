"""
Pydantic Models for RFID / NFC Smart Card & Artifact Tag Integration in Setu AI.
"""
from datetime import datetime
from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.user import PyObjectId, UserOut

RFIDTagType = Literal["user_card", "knowledge_passport", "kiosk_badge", "generic"]
RFIDScanStatus = Literal["authenticated", "knowledge_retrieved", "unregistered"]
RFIDScanAction = Literal["login", "view_knowledge", "bind_prompt"]

class RFIDScanIn(BaseModel):
    """Payload received when an RFID card or NFC tag is scanned/tapped."""
    tag_uid: str = Field(..., min_length=3, max_length=64, description="RFID/NFC card UID or badge identifier (e.g. 'RFID-SETU-HARBHAJAN')")
    device_id: Optional[str] = Field(default="village-kiosk-main", description="Identifier of the scanner hardware or kiosk terminal")
    reader_type: Optional[str] = Field(default="usb_wedge", description="Reader type: 'usb_wedge', 'serial', 'web_nfc', 'simulator'")

class RFIDAuthData(BaseModel):
    """Authentication data returned on user smart card tap."""
    user: UserOut
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RFIDKnowledgeData(BaseModel):
    """Knowledge Passport data returned on physical artifact RFID tap."""
    id: str
    passport_id: Optional[str] = None
    title: str
    category: str
    description: str
    contributor_name: Optional[str] = "Elder Contributor"
    status: str = "completed"
    trust_score: Optional[float] = 1.0
    verification_count: Optional[int] = 0
    created_at: Optional[datetime] = None

class RFIDScanOut(BaseModel):
    """Unified response returned after processing an RFID scan/tap event."""
    status: RFIDScanStatus
    action: RFIDScanAction
    tag_uid: str
    tag_type: Optional[RFIDTagType] = None
    label: Optional[str] = None
    message: str
    auth_data: Optional[RFIDAuthData] = None
    knowledge_data: Optional[RFIDKnowledgeData] = None
    scanned_at: datetime

class RFIDBindUserIn(BaseModel):
    """Payload to pair/bind an RFID card UID to a user profile."""
    tag_uid: str = Field(..., min_length=3, max_length=64)
    label: Optional[str] = Field(default="Personal Setu Smart Badge", max_length=100)

class RFIDBindKnowledgeIn(BaseModel):
    """Payload to pair/bind an RFID tag UID to a Knowledge Entry."""
    tag_uid: str = Field(..., min_length=3, max_length=64)
    entry_id: str = Field(..., description="Knowledge Entry Mongo ObjectId or Passport ID")
    label: Optional[str] = Field(default="Physical Artifact Tag", max_length=100)

class RFIDTagOut(BaseModel):
    """Registered RFID Tag metadata."""
    id: PyObjectId = Field(..., alias="_id")
    tag_uid: str
    tag_type: RFIDTagType
    label: str
    user_id: Optional[PyObjectId] = None
    entry_id: Optional[PyObjectId] = None
    user_name: Optional[str] = None
    entry_title: Optional[str] = None
    created_by: Optional[PyObjectId] = None
    created_at: datetime
    last_scanned_at: Optional[datetime] = None
    scan_count: int = 0

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class RFIDScanLogOut(BaseModel):
    """RFID Scan audit record for kiosk diagnostics."""
    id: PyObjectId = Field(..., alias="_id")
    tag_uid: str
    device_id: Optional[str] = None
    reader_type: Optional[str] = None
    action_taken: str
    status: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class RFIDSeedResponse(BaseModel):
    """Response returned when seeding default simulation cards."""
    success: bool = True
    seeded_count: int
    message: str
