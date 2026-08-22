import logging
from datetime import datetime, timezone
from typing import Optional, List, Annotated
from fastapi import APIRouter, Depends, Query, status, HTTPException, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database import get_database
from app.core.dependencies import get_current_user
from app.models.knowledge_entry import CategoryType, KnowledgeEntryOut
from app.models.community import CommunityCreate, CommunityUpdate, CommunityOut
from app.services import knowledge_service
from app.routers.knowledge import validate_lang_param, translate_entry_if_needed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/communities", tags=["communities"])

@router.post("", response_model=CommunityOut, status_code=status.HTTP_201_CREATED)
async def create_community(
    comm_data: CommunityCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new community (authentication required).
    """
    creator_id = current_user["_id"]
    now = datetime.now(timezone.utc)
    
    comm_doc = {
        "name": comm_data.name.strip(),
        "description": comm_data.description.strip(),
        "category": comm_data.category,
        "visibility": comm_data.visibility,
        "admin_id": creator_id,
        "members": [creator_id],
        "created_at": now,
        "updated_at": None
    }
    
    res = await db["communities"].insert_one(comm_doc)
    comm_doc["_id"] = res.inserted_id
    comm_doc["member_count"] = 1
    return comm_doc

@router.get("", response_model=dict)
async def list_communities(
    category: Optional[CategoryType] = Query(None),
    visibility: Optional[str] = Query(None),
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    skip: Annotated[int, Query(ge=0)] = 0,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    List communities with filters and pagination.
    """
    query = {}
    if category:
        query["category"] = category
    if visibility:
        query["visibility"] = visibility
        
    cursor = (
        db["communities"]
        .find(query)
        .sort([("created_at", -1)])
        .skip(skip)
        .limit(limit)
    )
    comms = await cursor.to_list(length=limit)
    total_count = await db["communities"].count_documents(query)
    
    resolved = []
    for c in comms:
        resolved.append({
            "id": str(c["_id"]),
            "name": c["name"],
            "description": c["description"],
            "category": c["category"],
            "visibility": c["visibility"],
            "admin_id": str(c["admin_id"]),
            "member_count": len(c["members"]),
            "created_at": c["created_at"],
            "updated_at": c.get("updated_at")
        })
        
    return {
        "count": total_count,
        "skip": skip,
        "limit": limit,
        "communities": resolved
    }

@router.get("/{id}", response_model=CommunityOut)
async def get_community(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get community details metadata (no members list).
    """
    try:
        comm_obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community ID format.")
        
    comm = await db["communities"].find_one({"_id": comm_obj_id})
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found.")
        
    comm["member_count"] = len(comm["members"])
    return comm

@router.post("/{id}/join", status_code=status.HTTP_200_OK)
async def join_community(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Join a public community.
    """
    try:
        comm_obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community ID format.")
        
    comm = await db["communities"].find_one({"_id": comm_obj_id})
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found.")
        
    user_id = current_user["_id"]
    
    if user_id in comm["members"]:
        return {"status": "success", "message": "Already a member."}
        
    if comm["visibility"] == "private":
        raise HTTPException(status_code=403, detail="Cannot join a private community.")
        
    await db["communities"].update_one(
        {"_id": comm_obj_id},
        {"$addToSet": {"members": user_id}}
    )
    return {"status": "success", "message": "Successfully joined community."}

@router.post("/{id}/leave", status_code=status.HTTP_200_OK)
async def leave_community(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Leave a community. Admins cannot leave without transferring ownership.
    """
    try:
        comm_obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community ID format.")
        
    comm = await db["communities"].find_one({"_id": comm_obj_id})
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found.")
        
    user_id = current_user["_id"]
    
    if user_id not in comm["members"]:
        return {"status": "success", "message": "Not a member."}
        
    if comm["admin_id"] == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer ownership before leaving."
        )
        
    await db["communities"].update_one(
        {"_id": comm_obj_id},
        {"$pull": {"members": user_id}}
    )
    return {"status": "success", "message": "Successfully left community."}

@router.put("/{id}", response_model=CommunityOut)
async def update_community(
    id: str,
    update_data: CommunityUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Update community metadata (admin only).
    """
    try:
        comm_obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community ID format.")
        
    comm = await db["communities"].find_one({"_id": comm_obj_id})
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found.")
        
    if comm["admin_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only the community admin can update metadata.")
        
    updates = {}
    if update_data.name is not None:
        updates["name"] = update_data.name.strip()
    if update_data.description is not None:
        updates["description"] = update_data.description.strip()
    if update_data.category is not None:
        updates["category"] = update_data.category
    if update_data.visibility is not None:
        updates["visibility"] = update_data.visibility
        
    if updates:
        now = datetime.now(timezone.utc)
        updates["updated_at"] = now
        await db["communities"].update_one(
            {"_id": comm_obj_id},
            {"$set": updates}
        )
        
    updated_comm = await db["communities"].find_one({"_id": comm_obj_id})
    updated_comm["member_count"] = len(updated_comm["members"])
    return updated_comm

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_community(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete a community (admin only). Nullifies community references in knowledge entries.
    """
    try:
        comm_obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community ID format.")
        
    comm = await db["communities"].find_one({"_id": comm_obj_id})
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found.")
        
    if comm["admin_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only the community admin can delete the community.")
        
    # Nullify references in knowledge entries
    await db["knowledge_entries"].update_many(
        {"community_id": comm_obj_id},
        {"$set": {"community_id": None}}
    )
    
    await db["communities"].delete_one({"_id": comm_obj_id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{id}/knowledge", response_model=List[KnowledgeEntryOut])
async def get_community_knowledge(
    id: str,
    status: Optional[str] = Query(None),
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    skip: Annotated[int, Query(ge=0)] = 0,
    lang: Optional[str] = Query(None, description="Preferred language code"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Retrieve knowledge entries associated with a community.
    """
    try:
        comm_obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community ID format.")
        
    comm = await db["communities"].find_one({"_id": comm_obj_id})
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found.")
        
    validated_lang = validate_lang_param(lang)
    
    query = {"community_id": comm_obj_id}
    if status:
        query["status"] = status
        
    cursor = db["knowledge_entries"].find(query).skip(skip).limit(limit)
    entries = await cursor.to_list(length=limit)
    
    if validated_lang:
        for idx in range(len(entries)):
            if entries[idx].get("status") == "completed":
                entries[idx] = await translate_entry_if_needed(entries[idx], validated_lang, db)
                
    return entries
