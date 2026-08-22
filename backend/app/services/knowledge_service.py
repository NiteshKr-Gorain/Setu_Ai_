from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.models.knowledge_entry import KnowledgeEntryCreate, KnowledgeEntryUpdate
import logging

logger = logging.getLogger(__name__)


async def create_knowledge_entry(db: AsyncIOMotorDatabase, contributor_id: str, entry_in: KnowledgeEntryCreate) -> dict:
    """Create a new knowledge entry in draft status."""
    now = datetime.now(timezone.utc)
    entry_dict = {
        "contributor_id": ObjectId(contributor_id),
        "title": entry_in.title,
        "description": entry_in.description,
        "category": entry_in.category,
        "status": "draft",
        "created_at": now,
        "updated_at": now
    }
    if entry_in.community_id:
        entry_dict["community_id"] = ObjectId(entry_in.community_id)
        
    result = await db["knowledge_entries"].insert_one(entry_dict)
    entry_dict["_id"] = result.inserted_id
    return entry_dict

async def get_knowledge_entries(
    db: AsyncIOMotorDatabase,
    category: Optional[str] = None,
    contributor_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    community_id: Optional[str] = None
) -> List[dict]:
    """Retrieve knowledge entries with pagination and filters."""
    query = {}
    if category:
        query["category"] = category
    if contributor_id:
        try:
            query["contributor_id"] = ObjectId(contributor_id)
        except Exception:
            return []
    if community_id:
        try:
            query["community_id"] = ObjectId(community_id)
        except Exception:
            return []
            
    cursor = db["knowledge_entries"].find(query).skip(skip).limit(limit)
    return await cursor.to_list(length=limit)

async def get_knowledge_entry_by_id(db: AsyncIOMotorDatabase, entry_id: str) -> Optional[dict]:
    """Retrieve a single knowledge entry by ID."""
    try:
        obj_id = ObjectId(entry_id)
    except Exception:
        return None
    return await db["knowledge_entries"].find_one({"_id": obj_id})

async def update_knowledge_entry(
    db: AsyncIOMotorDatabase,
    entry_id: str,
    user_id: str,
    entry_in: KnowledgeEntryUpdate
) -> dict:
    """Update a knowledge entry if the current user is the owner."""
    entry = await get_knowledge_entry_by_id(db, entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge entry not found"
        )
    
    if str(entry["contributor_id"]) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this knowledge entry"
        )
        
    update_data = {k: v for k, v in entry_in.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db["knowledge_entries"].update_one(
            {"_id": ObjectId(entry_id)},
            {"$set": update_data}
        )
        entry = await get_knowledge_entry_by_id(db, entry_id)
        
    return entry

async def delete_knowledge_entry(
    db: AsyncIOMotorDatabase,
    entry_id: str,
    user_id: str
) -> bool:
    """Delete a knowledge entry if the current user is the owner."""
    entry = await get_knowledge_entry_by_id(db, entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge entry not found"
        )
        
    if str(entry["contributor_id"]) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this knowledge entry"
        )
        
    file_url = entry.get("file_url")
    await db["knowledge_entries"].delete_one({"_id": ObjectId(entry_id)})
    
    # Delete related verifications safely
    try:
        await db["knowledge_verifications"].delete_many({"entry_id": ObjectId(entry_id)})
    except Exception as e:
        logger.error(f"Failed to delete related verifications for entry {entry_id}: {e}", exc_info=True)
        
    if file_url:
        from app.services.file_service import delete_file_from_disk
        delete_file_from_disk(file_url)
    return True

