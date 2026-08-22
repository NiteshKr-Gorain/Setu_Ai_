import logging
from datetime import datetime, timezone
from typing import Optional, List, Annotated
from fastapi import APIRouter, Depends, Query, status, HTTPException, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database import get_database
from app.core.dependencies import get_current_user
from app.models.knowledge_entry import CategoryType, KnowledgeEntryOut
from app.models.learning_path import LearningPathCreate, LearningPathUpdate, LearningPathOut
from app.routers.knowledge import validate_lang_param, translate_entry_if_needed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/learning-paths", tags=["learning-paths"])

async def validate_completed_entries(db: AsyncIOMotorDatabase, entry_ids: List[str]) -> List[ObjectId]:
    """
    Validate that all entry_ids exist and have status 'completed'.
    Raises HTTPException 400 if any are invalid.
    """
    object_ids = [ObjectId(eid) for eid in entry_ids]
    
    # Query all matching entries
    cursor = db["knowledge_entries"].find(
        {"_id": {"$in": object_ids}},
        {"_id": 1, "status": 1}
    )
    entries = await cursor.to_list(length=len(object_ids))
    
    valid_map = {str(e["_id"]): e.get("status") for e in entries}
    
    invalid_ids = []
    for eid in entry_ids:
        status_val = valid_map.get(eid)
        if status_val != "completed":
            invalid_ids.append(eid)
            
    if invalid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"invalid_entry_ids": invalid_ids}
        )
        
    return object_ids

@router.post("", response_model=LearningPathOut, status_code=status.HTTP_201_CREATED)
async def create_learning_path(
    path_data: LearningPathCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new learning path (authentication required).
    """
    creator_id = current_user["_id"]
    
    # Validate entry IDs exist and status is completed
    object_entry_ids = await validate_completed_entries(db, path_data.entry_ids)
    
    now = datetime.now(timezone.utc)
    path_doc = {
        "title": path_data.title.strip(),
        "description": path_data.description.strip(),
        "category": path_data.category,
        "creator_id": creator_id,
        "entry_ids": object_entry_ids,
        "created_at": now,
        "updated_at": None
    }
    
    res = await db["learning_paths"].insert_one(path_doc)
    path_doc["_id"] = res.inserted_id
    path_doc["entry_count"] = len(object_entry_ids)
    # Convert ObjectIds to strings for Pydantic mapping
    path_doc["entry_ids"] = [str(eid) for eid in object_entry_ids]
    return path_doc

@router.get("", response_model=dict)
async def list_learning_paths(
    category: Optional[CategoryType] = Query(None),
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    skip: Annotated[int, Query(ge=0)] = 0,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Public listing of learning paths.
    """
    query = {}
    if category:
        query["category"] = category
        
    cursor = (
        db["learning_paths"]
        .find(query)
        .sort([("created_at", -1)])
        .skip(skip)
        .limit(limit)
    )
    paths = await cursor.to_list(length=limit)
    total_count = await db["learning_paths"].count_documents(query)
    
    resolved_paths = []
    for p in paths:
        resolved_paths.append({
            "id": str(p["_id"]),
            "title": p["title"],
            "description": p["description"],
            "category": p["category"],
            "creator_id": str(p["creator_id"]),
            "entry_ids": [str(eid) for eid in p["entry_ids"]],
            "entry_count": len(p["entry_ids"]),
            "created_at": p["created_at"],
            "updated_at": p.get("updated_at")
        })
        
    return {
        "count": total_count,
        "skip": skip,
        "limit": limit,
        "learning_paths": resolved_paths
    }

@router.get("/{id}", response_model=LearningPathOut)
async def get_learning_path(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get learning path details metadata (no entries expansion).
    """
    try:
        path_obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid learning path ID format."
        )
        
    path = await db["learning_paths"].find_one({"_id": path_obj_id})
    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found."
        )
        
    path["entry_count"] = len(path["entry_ids"])
    path["entry_ids"] = [str(eid) for eid in path["entry_ids"]]
    return path

@router.get("/{id}/entries", response_model=List[KnowledgeEntryOut])
async def get_learning_path_entries(
    id: str,
    lang: Optional[str] = Query(None, description="Preferred language code"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Retrieve expanded knowledge entries in exact learning path order.
    Skips missing/deleted entries safely and supports translation lang queries.
    """
    try:
        path_obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid learning path ID format."
        )
        
    path = await db["learning_paths"].find_one({"_id": path_obj_id})
    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found."
        )
        
    validated_lang = validate_lang_param(lang)
    
    # Query all matching entries
    entries_cursor = db["knowledge_entries"].find({"_id": {"$in": path["entry_ids"]}})
    entries = await entries_cursor.to_list(length=len(path["entry_ids"]))
    
    # Map to restore exact ordering
    entry_map = {str(e["_id"]): e for e in entries}
    ordered_entries = []
    
    for entry_id_obj in path["entry_ids"]:
        eid_str = str(entry_id_obj)
        if eid_str in entry_map:
            ordered_entries.append(entry_map[eid_str])
        else:
            logger.warning(f"Knowledge entry {eid_str} in learning path {id} is missing or deleted.")
            
    # Apply translation if lang provided
    if validated_lang:
        for idx in range(len(ordered_entries)):
            if ordered_entries[idx].get("status") == "completed":
                ordered_entries[idx] = await translate_entry_if_needed(ordered_entries[idx], validated_lang, db)
                
    return ordered_entries

@router.put("/{id}", response_model=LearningPathOut)
async def update_learning_path(
    id: str,
    update_data: LearningPathUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Update a learning path (creator authorization required).
    """
    try:
        path_obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid learning path ID format."
        )
        
    path = await db["learning_paths"].find_one({"_id": path_obj_id})
    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found."
        )
        
    # Check creator identity
    if path["creator_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this learning path."
        )
        
    updates = {}
    if update_data.title is not None:
        updates["title"] = update_data.title.strip()
    if update_data.description is not None:
        updates["description"] = update_data.description.strip()
    if update_data.category is not None:
        updates["category"] = update_data.category
    if update_data.entry_ids is not None:
        object_entry_ids = await validate_completed_entries(db, update_data.entry_ids)
        updates["entry_ids"] = object_entry_ids
        
    if updates:
        now = datetime.now(timezone.utc)
        updates["updated_at"] = now
        await db["learning_paths"].update_one(
            {"_id": path_obj_id},
            {"$set": updates}
        )
        
    updated_path = await db["learning_paths"].find_one({"_id": path_obj_id})
    updated_path["entry_count"] = len(updated_path["entry_ids"])
    updated_path["entry_ids"] = [str(eid) for eid in updated_path["entry_ids"]]
    return updated_path

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_learning_path(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete a learning path (creator authorization required).
    """
    try:
        path_obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid learning path ID format."
        )
        
    path = await db["learning_paths"].find_one({"_id": path_obj_id})
    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found."
        )
        
    if path["creator_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this learning path."
        )
        
    await db["learning_paths"].delete_one({"_id": path_obj_id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
