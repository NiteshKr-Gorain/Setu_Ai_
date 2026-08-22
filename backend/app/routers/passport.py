import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database import get_database
from app.models.passport import (
    PassportSummaryOut,
    KnowledgeVersionOut,
    AuditTimelineEventOut,
    IntegrityVerificationOut,
    KnowledgeVersionDetailOut,
    KnowledgeVersionHistoryOut,
    KnowledgeVersionCreate,
    ProvenanceChainOut
)
from app.services import passport_service
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge", tags=["passport"])

@router.get("/{id}/passport", response_model=PassportSummaryOut)
async def get_passport_summary(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get summary metadata of the Knowledge Passport.
    """
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid knowledge entry ID format."
        )

    entry = await db["knowledge_entries"].find_one({"_id": obj_id})
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge entry not found."
        )

    # Fallback default values for un-migrated items
    return {
        "passport_id": entry.get("passport_id", f"SETU-KNOW-UNMIGRATED-{id[:6].upper()}"),
        "entry_id": str(entry["_id"]),
        "version_number": entry.get("version_number", 1),
        "content_hash": entry.get("content_hash", ""),
        "trust_score": entry.get("trust_score", 0.0),
        "verification_count": entry.get("verification_count", 0)
    }

@router.get("/{id}/versions", response_model=List[KnowledgeVersionHistoryOut])
async def list_versions(
    id: str,
    skip: int = 0,
    limit: int = 50,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Retrieve historical lightweight snapshots for a knowledge entry, sorted newest-first.
    """
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid knowledge entry ID format."
        )

    versions = await passport_service.get_version_history(db, obj_id, skip=skip, limit=limit)
    return versions

@router.get("/{id}/versions/{version}", response_model=KnowledgeVersionDetailOut)
async def get_version_details(
    id: str,
    version: int,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific version snapshot detail, including full content.
    """
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid knowledge entry ID format."
        )

    snapshot = await passport_service.get_version_detail(db, obj_id, version)
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version {version} not found for this entry."
        )
    return snapshot

@router.post("/{id}/versions", response_model=KnowledgeVersionDetailOut, status_code=status.HTTP_201_CREATED)
async def create_new_version(
    id: str,
    version_in: KnowledgeVersionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Appends a new version snapshot for the specified article.
    Computes hash server-side and increments version number.
    """
    try:
        obj_id = ObjectId(id)
        actor_id = ObjectId(current_user["_id"])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format."
        )

    entry = await db["knowledge_entries"].find_one({"_id": obj_id})
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge entry not found."
        )

    # Save version
    new_version_doc = await passport_service.save_knowledge_version(
        db=db,
        article_id=obj_id,
        content=version_in.content,
        changed_by=actor_id,
        change_summary=version_in.change_summary,
        citations=version_in.citations,
        source=version_in.source
    )
    
    # Sync main entry version/hash
    await db["knowledge_entries"].update_one(
        {"_id": obj_id},
        {
            "$set": {
                "version_number": new_version_doc["version_number"],
                "content_hash": new_version_doc["sha256_hash"],
                "updated_at": new_version_doc["created_at"]
            }
        }
    )

    return new_version_doc

@router.get("/{id}/versions/{version}/verify", response_model=dict)
async def verify_specific_version_integrity(
    id: str,
    version: int,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Cryptographically verify the integrity of a specific version snapshot.
    """
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format."
        )

    try:
        verified, computed_hash, recorded_hash = await passport_service.verify_version_integrity(
            db, obj_id, version
        )
        return {
            "verified": verified,
            "computed_hash": computed_hash,
            "recorded_hash": recorded_hash,
            "version_number": version,
            "message": "Signature check passed." if verified else "Signature verification failed. Data tampered."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/{id}/timeline", response_model=dict)
async def get_timeline(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get the audit trail event history for provenance tracking.
    """
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid knowledge entry ID format."
        )

    cursor = db["knowledge_audit_trail"].find({"entry_id": obj_id}).sort("created_at", 1)
    timeline = await cursor.to_list(length=200)

    # Format events to string ids for serialization compatibility
    formatted_timeline = []
    for event in timeline:
        formatted_timeline.append({
            "id": str(event["_id"]),
            "entry_id": str(event["entry_id"]),
            "event_type": event["event_type"],
            "actor_id": str(event["actor_id"]),
            "actor_name": event["actor_name"],
            "description": event["description"],
            "metadata": event.get("metadata", {}),
            "created_at": event["created_at"]
        })

    return {"timeline": formatted_timeline}

@router.get("/{id}/verify-integrity", response_model=IntegrityVerificationOut)
async def verify_integrity(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Cryptographically verify the integrity of the active version content.
    """
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid knowledge entry ID format."
        )

    entry = await db["knowledge_entries"].find_one({"_id": obj_id})
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge entry not found."
        )

    title = entry.get("title", "")
    description = entry.get("description", "")
    stored_hash = entry.get("content_hash", "")
    version_number = entry.get("version_number", 1)

    computed_hash = passport_service.generate_content_hash(title, description)

    if not stored_hash:
        return {
            "verified": False,
            "computed_hash": computed_hash,
            "stored_hash": "",
            "version_number": version_number,
            "message": "Verification warning: Stored hash is empty. Database needs migration."
        }

    if computed_hash == stored_hash:
        return {
            "verified": True,
            "computed_hash": computed_hash,
            "stored_hash": stored_hash,
            "version_number": version_number,
            "message": "Integrity check passed. Content is secure and authentic."
        }
    else:
        return {
            "verified": False,
            "computed_hash": computed_hash,
            "stored_hash": stored_hash,
            "version_number": version_number,
            "message": "Integrity check failed. Content signature does not match database record."
        }

@router.get("/{id}/provenance", response_model=ProvenanceChainOut)
async def get_provenance(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get formatted provenance chain tracking for the current article version.
    """
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format."
        )

    try:
        chain = await passport_service.get_provenance_chain(db, obj_id)
        return chain
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/{id}/verify", response_model=KnowledgeVersionDetailOut)
async def verify_article_version(
    id: str,
    version: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Expert/contributor action to verify a specific version of a knowledge article.
    """
    if current_user.get("role") not in ["contributor", "both", "admin", "expert"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform version verifications."
        )

    try:
        obj_id = ObjectId(id)
        actor_id = ObjectId(current_user["_id"])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format."
        )

    try:
        verified_snapshot = await passport_service.verify_version(
            db=db,
            article_id=obj_id,
            version_number=version,
            reviewer_id=actor_id
        )
        return verified_snapshot
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
