"""
FastAPI Router for RFID / NFC Smart Card & Artifact Knowledge Tag Scanning and Management.
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.core.dependencies import get_current_user
from app.models.rfid import (
    RFIDScanIn,
    RFIDScanOut,
    RFIDBindUserIn,
    RFIDBindKnowledgeIn,
    RFIDTagOut,
    RFIDScanLogOut,
    RFIDSeedResponse
)
from app.services import rfid_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rfid", tags=["rfid"])

@router.post("/scan", response_model=RFIDScanOut)
async def scan_rfid_tag(
    payload: RFIDScanIn,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Universal RFID / NFC Tap Endpoint (Public).
    Processes an RFID card or physical artifact tag scan.
    - If user smart card: Authenticates & returns JWT tokens (Tap-to-Login).
    - If knowledge passport tag: Retrieves knowledge entry & passport ledger.
    - If unregistered: Returns registration prompt.
    """
    return await rfid_service.process_rfid_scan(db=db, scan_in=payload)

@router.post("/bind-user", response_model=RFIDTagOut)
async def bind_user_card(
    payload: RFIDBindUserIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Pair / Bind an RFID card UID to the currently authenticated user.
    """
    user_id = str(current_user.get("_id") or current_user.get("id"))
    tag_doc = await rfid_service.bind_user_card(db=db, user_id=user_id, bind_in=payload)
    return RFIDTagOut(**tag_doc)

@router.post("/bind-knowledge", response_model=RFIDTagOut)
async def bind_knowledge_tag(
    payload: RFIDBindKnowledgeIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Pair / Bind an RFID tag UID to a specific Knowledge Entry / Passport.
    """
    user_id = str(current_user.get("_id") or current_user.get("id"))
    tag_doc = await rfid_service.bind_knowledge_tag(db=db, user_id=user_id, bind_in=payload)
    return RFIDTagOut(**tag_doc)

@router.get("/tags", response_model=List[RFIDTagOut])
async def list_tags(
    tag_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    List registered RFID tags. Admins view all; other users view their own tags.
    """
    user_id = str(current_user.get("_id") or current_user.get("id"))
    is_admin = current_user.get("role") == "admin" or "admin" in str(current_user.get("email", ""))
    
    tags = await rfid_service.list_rfid_tags(
        db=db,
        user_id=None if is_admin else user_id,
        tag_type=tag_type,
        skip=skip,
        limit=limit
    )
    return [RFIDTagOut(**t) for t in tags]

@router.get("/tags/{tag_uid}", response_model=RFIDTagOut)
async def get_tag_by_uid(
    tag_uid: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Look up metadata for a single RFID tag UID.
    """
    normalized_uid = rfid_service.normalize_tag_uid(tag_uid)
    tag_doc = await db["rfid_tags"].find_one({"tag_uid": normalized_uid})
    if not tag_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"RFID tag '{tag_uid}' not found"
        )
    return RFIDTagOut(**tag_doc)

@router.delete("/tags/{tag_uid}")
async def delete_tag(
    tag_uid: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Unbind and remove a registered RFID tag.
    """
    user_id = str(current_user.get("_id") or current_user.get("id"))
    is_admin = current_user.get("role") == "admin" or "admin" in str(current_user.get("email", ""))
    
    success = await rfid_service.delete_rfid_tag(
        db=db,
        tag_uid=tag_uid,
        user_id=user_id,
        is_admin=is_admin
    )
    return {"success": success, "message": f"RFID tag '{tag_uid}' unlinked successfully."}

@router.get("/history", response_model=List[RFIDScanLogOut])
async def get_scan_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get recent RFID scan logs for kiosk diagnostics and analytics.
    """
    logs = await rfid_service.get_rfid_scan_history(db=db, limit=limit)
    return [RFIDScanLogOut(**l) for l in logs]

@router.post("/seed", response_model=RFIDSeedResponse)
async def seed_rfid_demo_data(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Seed realistic starter RFID smart cards and artifact tags for instant testing and demo.
    """
    result = await rfid_service.seed_default_rfid_tags(db=db)
    return RFIDSeedResponse(**result)
