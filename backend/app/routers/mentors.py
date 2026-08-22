import logging
from datetime import datetime, timezone
from typing import Optional, List, Literal, Annotated
from fastapi import APIRouter, Depends, Query, status, HTTPException, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database import get_database
from app.core.dependencies import get_current_user
from app.models.knowledge_entry import CategoryType
from app.models.mentor import MentorProfileCreate, MentorProfileOut
from app.models.mentor_request import MentorRequestCreate, MentorRequestOut
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mentors", tags=["mentors"])

class MentorRequestDecision(BaseModel):
    status: Literal["accepted", "declined"]

@router.post("/profile", response_model=MentorProfileOut)
async def create_or_update_profile(
    profile_data: MentorProfileCreate,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create or update the authenticated user's mentor profile.
    """
    user_id = current_user["_id"]
    now = datetime.now(timezone.utc)
    
    # Atomic Upsert logic
    existing = await db["mentor_profiles"].find_one({"user_id": user_id})
    if existing:
        update_fields = profile_data.model_dump()
        update_fields["updated_at"] = now
        await db["mentor_profiles"].update_one(
            {"user_id": user_id},
            {"$set": update_fields}
        )
        profile = await db["mentor_profiles"].find_one({"user_id": user_id})
        response.status_code = status.HTTP_200_OK
    else:
        profile_doc = profile_data.model_dump()
        profile_doc["user_id"] = user_id
        profile_doc["created_at"] = now
        profile_doc["updated_at"] = None
        profile_doc["rating_avg"] = 0.0
        profile_doc["rating_count"] = 0
        res = await db["mentor_profiles"].insert_one(profile_doc)
        profile = await db["mentor_profiles"].find_one({"_id": res.inserted_id})
        response.status_code = status.HTTP_201_CREATED
        
    profile["name"] = current_user["name"]
    return profile

@router.get("/requests/incoming", response_model=List[MentorRequestOut])
async def get_incoming_requests(
    status: Annotated[Optional[Literal["pending", "accepted", "declined"]], Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    skip: Annotated[int, Query(ge=0)] = 0,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Retrieve incoming mentorship requests for the authenticated user (must be a mentor).
    """
    mentor_profile = await db["mentor_profiles"].find_one({"user_id": current_user["_id"]})
    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Create a mentor profile before viewing incoming mentorship requests."
        )
        
    query = {"mentor_id": current_user["_id"]}
    if status:
        query["status"] = status
        
    cursor = (
        db["mentor_requests"]
        .find(query)
        .sort([("created_at", -1)])
        .skip(skip)
        .limit(limit)
    )
    requests = await cursor.to_list(length=limit)
    
    # Resolve names without N+1 query pattern
    user_ids = set()
    for r in requests:
        user_ids.add(r["learner_id"])
        user_ids.add(r["mentor_id"])
        
    users = await db["users"].find({"_id": {"$in": list(user_ids)}}).to_list(length=len(user_ids))
    user_map = {u["_id"]: u["name"] for u in users}
    
    resolved_requests = []
    for r in requests:
        learner_name = user_map.get(r["learner_id"])
        if not learner_name:
            logger.warning(f"Orphaned request {r['_id']}: learner {r['learner_id']} not found.")
            learner_name = "Deleted User"
            
        mentor_name = user_map.get(r["mentor_id"])
        if not mentor_name:
            logger.warning(f"Orphaned request {r['_id']}: mentor {r['mentor_id']} not found.")
            mentor_name = "Deleted User"
            
        resolved_requests.append({
            "id": str(r["_id"]),
            "learner_id": str(r["learner_id"]),
            "learner_name": learner_name,
            "mentor_id": str(r["mentor_id"]),
            "mentor_name": mentor_name,
            "message": r["message"],
            "status": r["status"],
            "created_at": r["created_at"],
            "updated_at": r.get("updated_at")
        })
    return resolved_requests

@router.get("/requests/outgoing", response_model=List[MentorRequestOut])
async def get_outgoing_requests(
    status: Annotated[Optional[Literal["pending", "accepted", "declined"]], Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    skip: Annotated[int, Query(ge=0)] = 0,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Retrieve outgoing mentorship requests sent by the authenticated user.
    """
    query = {"learner_id": current_user["_id"]}
    if status:
        query["status"] = status
        
    cursor = (
        db["mentor_requests"]
        .find(query)
        .sort([("created_at", -1)])
        .skip(skip)
        .limit(limit)
    )
    requests = await cursor.to_list(length=limit)
    
    # Resolve names without N+1 query pattern
    user_ids = set()
    for r in requests:
        user_ids.add(r["learner_id"])
        user_ids.add(r["mentor_id"])
        
    users = await db["users"].find({"_id": {"$in": list(user_ids)}}).to_list(length=len(user_ids))
    user_map = {u["_id"]: u["name"] for u in users}
    
    resolved_requests = []
    for r in requests:
        learner_name = user_map.get(r["learner_id"])
        if not learner_name:
            logger.warning(f"Orphaned request {r['_id']}: learner {r['learner_id']} not found.")
            learner_name = "Deleted User"
            
        mentor_name = user_map.get(r["mentor_id"])
        if not mentor_name:
            logger.warning(f"Orphaned request {r['_id']}: mentor {r['mentor_id']} not found.")
            mentor_name = "Deleted User"
            
        resolved_requests.append({
            "id": str(r["_id"]),
            "learner_id": str(r["learner_id"]),
            "learner_name": learner_name,
            "mentor_id": str(r["mentor_id"]),
            "mentor_name": mentor_name,
            "message": r["message"],
            "status": r["status"],
            "created_at": r["created_at"],
            "updated_at": r.get("updated_at")
        })
    return resolved_requests

@router.put("/requests/{request_id}")
async def resolve_mentorship_request(
    request_id: str,
    decision: MentorRequestDecision,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Accept or decline a mentorship request (mentor authorization required).
    """
    try:
        req_obj_id = ObjectId(request_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request ID format."
        )
        
    # Atomic state transition rule
    res = await db["mentor_requests"].update_one(
        {
            "_id": req_obj_id,
            "mentor_id": current_user["_id"],
            "status": "pending"
        },
        {
            "$set": {
                "status": decision.status,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if res.matched_count == 0:
        # Determine why it didn't match
        request = await db["mentor_requests"].find_one({"_id": req_obj_id})
        if not request or request["mentor_id"] != current_user["_id"]:
            # Hidden to unauthorized users
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mentorship request not found."
            )
        if request["status"] != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This mentorship request has already been resolved."
            )
            
    return {"message": f"Request {decision.status} successfully."}

@router.get("", response_model=dict)
async def list_mentors(
    category: Annotated[Optional[CategoryType], Query()] = None,
    min_experience: Annotated[Optional[int], Query(ge=0, le=80)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    skip: Annotated[int, Query(ge=0)] = 0,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Public listing of mentor profiles.
    """
    query = {}
    if category:
        query["expertise_categories"] = category
    if min_experience is not None:
        query["years_of_experience"] = {"$gte": min_experience}
        
    cursor = (
        db["mentor_profiles"]
        .find(query)
        .sort([
            ("years_of_experience", -1),
            ("rating_avg", -1),
            ("created_at", -1)
        ])
        .skip(skip)
        .limit(limit)
    )
    profiles = await cursor.to_list(length=limit)
    
    # Resolve names without N+1 query pattern
    user_ids = [p["user_id"] for p in profiles]
    users = await db["users"].find({"_id": {"$in": user_ids}}).to_list(length=len(user_ids))
    user_map = {u["_id"]: u["name"] for u in users}
    
    resolved_profiles = []
    for p in profiles:
        name = user_map.get(p["user_id"])
        if not name:
            logger.warning(f"Orphaned profile: user {p['user_id']} not found. Skipping.")
            continue  # Skip profile without corresponding user
            
        resolved_profiles.append({
            "id": str(p["_id"]),
            "user_id": str(p["user_id"]),
            "name": name,
            "bio": p["bio"],
            "expertise_categories": p["expertise_categories"],
            "years_of_experience": p["years_of_experience"],
            "availability": p["availability"],
            "contact_preference": p["contact_preference"],
            "rating_avg": p.get("rating_avg", 0.0),
            "rating_count": p.get("rating_count", 0),
            "created_at": p["created_at"],
            "updated_at": p.get("updated_at")
        })
        
    return {
        "count": len(resolved_profiles),
        "skip": skip,
        "limit": limit,
        "mentors": resolved_profiles
    }

@router.get("/{user_id}", response_model=MentorProfileOut)
async def get_mentor_profile(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get the mentor profile detail for a specific mentor user.
    """
    try:
        target_obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format."
        )
        
    profile = await db["mentor_profiles"].find_one({"user_id": target_obj_id})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found."
        )
        
    user = await db["users"].find_one({"_id": target_obj_id})
    if not user:
        logger.warning(f"Orphaned profile: user {target_obj_id} not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated user no longer exists."
        )
        
    profile["id"] = str(profile["_id"])
    profile["user_id"] = str(profile["user_id"])
    profile["name"] = user["name"]
    return profile

@router.post("/{mentor_user_id}/request", response_model=MentorRequestOut, status_code=status.HTTP_201_CREATED)
async def send_mentorship_request(
    mentor_user_id: str,
    request_data: MentorRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Send a mentorship request to a mentor.
    """
    try:
        mentor_obj_id = ObjectId(mentor_user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mentor user ID format."
        )
        
    if current_user["_id"] == mentor_obj_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot send a mentorship request to yourself."
        )
        
    mentor_profile = await db["mentor_profiles"].find_one({"user_id": mentor_obj_id})
    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target mentor profile not found."
        )
        
    mentor_user = await db["users"].find_one({"_id": mentor_obj_id})
    if not mentor_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated mentor user no longer exists."
        )
        
    # Check for duplicate pending request (enforced via partial index or atomic query check)
    existing_pending = await db["mentor_requests"].find_one({
        "learner_id": current_user["_id"],
        "mentor_id": mentor_obj_id,
        "status": "pending"
    })
    if existing_pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending mentorship request already exists for this mentor."
        )
        
    now = datetime.now(timezone.utc)
    request_doc = {
        "learner_id": current_user["_id"],
        "mentor_id": mentor_obj_id,
        "message": request_data.message.strip(),
        "status": "pending",
        "created_at": now,
        "updated_at": None
    }
    
    # Try inserting (partial unique index handles concurrency edge cases)
    try:
        res = await db["mentor_requests"].insert_one(request_doc)
    except Exception as e:
        # Check if due to unique constraint
        logger.error(f"Failed to create request: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending mentorship request already exists for this mentor."
        )
        
    request_doc["id"] = str(res.inserted_id)
    request_doc["learner_id"] = str(current_user["_id"])
    request_doc["learner_name"] = current_user["name"]
    request_doc["mentor_id"] = str(mentor_obj_id)
    request_doc["mentor_name"] = mentor_user["name"]
    return request_doc
