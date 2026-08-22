import logging
from datetime import datetime, timezone
from typing import Optional, List, Literal, Annotated
from fastapi import APIRouter, Depends, Query, status, HTTPException, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database import get_database
from app.core.dependencies import get_current_user
from app.models.verification import VerificationCreate, VerificationOut
from app.services.verification_service import recompute_entry_trust

logger = logging.getLogger(__name__)

router = APIRouter(tags=["verification"])

@router.post("/knowledge/{entry_id}/verify", response_model=VerificationOut)
async def verify_knowledge_entry(
    entry_id: str,
    verification_data: VerificationCreate,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Submit or update a verification review for a knowledge entry.
    """
    try:
        entry_obj_id = ObjectId(entry_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid knowledge entry ID format."
        )
        
    entry = await db["knowledge_entries"].find_one({"_id": entry_obj_id})
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge entry not found."
        )
        
    # Self-verification check
    if str(entry.get("contributor_id")) == str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot verify your own knowledge entry."
        )
        
    filter_doc = {
        "entry_id": entry_obj_id,
        "reviewer_id": current_user["_id"]
    }
    
    now = datetime.now(timezone.utc)
    
    # Check if this is a creation or an update to set the response status code
    existing = await db["knowledge_verifications"].find_one(filter_doc)
    if existing:
        response.status_code = status.HTTP_200_OK
    else:
        response.status_code = status.HTTP_201_CREATED
        
    update_doc = {
        "$set": {
            "trust_level": verification_data.trust_level,
            "comment": verification_data.comment,
            "updated_at": now
        },
        "$setOnInsert": {
            "created_at": now,
            "entry_id": entry_obj_id,
            "reviewer_id": current_user["_id"]
        }
    }
    
    # Atomic Upsert using unique indexes
    doc = await db["knowledge_verifications"].find_one_and_update(
        filter_doc,
        update_doc,
        upsert=True,
        return_document=True
    )
    
    # Recompute trust score and count
    await recompute_entry_trust(db, entry_id)
    
    doc["id"] = str(doc["_id"])
    doc["entry_id"] = str(doc["entry_id"])
    doc["reviewer_id"] = str(doc["reviewer_id"])
    doc["reviewer_name"] = current_user["name"]
    
    return doc

@router.get("/knowledge/{entry_id}/verifications", response_model=dict)
async def get_knowledge_verifications(
    entry_id: str,
    trust_level: Annotated[Optional[Literal["verified", "needs_review", "disputed"]], Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    skip: Annotated[int, Query(ge=0)] = 0,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Retrieve verification reviews for a knowledge entry.
    """
    try:
        entry_obj_id = ObjectId(entry_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid knowledge entry ID format."
        )
        
    entry = await db["knowledge_entries"].find_one({"_id": entry_obj_id})
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge entry not found."
        )
        
    query = {"entry_id": entry_obj_id}
    if trust_level:
        query["trust_level"] = trust_level
        
    cursor = (
        db["knowledge_verifications"]
        .find(query)
        .sort([("created_at", -1)])
        .skip(skip)
        .limit(limit)
    )
    verifications = await cursor.to_list(length=limit)
    
    # Batch resolve reviewer names to prevent N+1 queries
    reviewer_ids = [v["reviewer_id"] for v in verifications]
    users = await db["users"].find({"_id": {"$in": reviewer_ids}}).to_list(length=len(reviewer_ids))
    user_map = {u["_id"]: u["name"] for u in users}
    
    resolved_list = []
    for v in verifications:
        reviewer_name = user_map.get(v["reviewer_id"])
        if not reviewer_name:
            logger.warning(f"Orphaned verification {v['_id']}: reviewer user {v['reviewer_id']} not found.")
            reviewer_name = "Deleted User"
            
        resolved_list.append({
            "id": str(v["_id"]),
            "entry_id": str(v["entry_id"]),
            "reviewer_id": str(v["reviewer_id"]),
            "reviewer_name": reviewer_name,
            "trust_level": v["trust_level"],
            "comment": v.get("comment"),
            "created_at": v["created_at"],
            "updated_at": v.get("updated_at")
        })
        
    return {
        "count": len(resolved_list),
        "skip": skip,
        "limit": limit,
        "trust_score": entry.get("trust_score", 0.0),
        "verification_count": entry.get("verification_count", 0),
        "verifications": resolved_list
    }
