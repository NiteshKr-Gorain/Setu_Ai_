from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.models.knowledge_entry import KnowledgeEntryCreate, KnowledgeEntryUpdate
import logging

logger = logging.getLogger(__name__)


async def create_knowledge_entry(db: AsyncIOMotorDatabase, contributor_id: str, entry_in: KnowledgeEntryCreate) -> dict:
    """Create a new knowledge entry in draft status with passport credentials, wrapped in a transaction."""
    from app.services import passport_service
    
    now = datetime.now(timezone.utc)
    contributor_obj_id = ObjectId(contributor_id)
    
    passport_id = await passport_service.get_unique_passport_id(db)
    content_hash = passport_service.generate_content_hash(entry_in.title, entry_in.description)
    
    entry_dict = {
        "contributor_id": contributor_obj_id,
        "title": entry_in.title,
        "description": entry_in.description,
        "category": entry_in.category,
        "status": "draft",
        "created_at": now,
        "updated_at": now,
        "passport_id": passport_id,
        "content_hash": content_hash,
        "version_number": 1
    }
    if entry_in.community_id:
        entry_dict["community_id"] = ObjectId(entry_in.community_id)

    # Resolve contributor user name for audit logging
    user_name = "Contributor"
    user_doc = await db["users"].find_one({"_id": contributor_obj_id})
    if user_doc:
        user_name = user_doc.get("name", "Contributor")

    # Run inserts inside a MongoDB transaction session
    async with await db.client.start_session() as session:
        async with session.start_transaction():
            result = await db["knowledge_entries"].insert_one(entry_dict, session=session)
            entry_dict["_id"] = result.inserted_id
            
            # Store initial Version 1 snapshot
            await passport_service.create_version_snapshot(
                db=db,
                entry_id=entry_dict["_id"],
                passport_id=passport_id,
                version_number=1,
                title=entry_in.title,
                description=entry_in.description,
                content_hash=content_hash,
                previous_hash=None,
                changed_by=contributor_obj_id,
                session=session
            )

            # Record CREATED event
            await passport_service.create_audit_event(
                db=db,
                entry_id=entry_dict["_id"],
                event_type="CREATED",
                actor_id=contributor_obj_id,
                actor_name=user_name,
                description=f"Knowledge entry created and stamped with Passport ID: {passport_id}.",
                metadata={"version_number": 1, "content_hash": content_hash},
                session=session
            )
            
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
    """Update a knowledge entry if the current user is the owner, applying OCC transaction checks."""
    from app.services import passport_service
    
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

    # Clean incoming data
    update_data = {k: v for k, v in entry_in.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        return entry

    # Calculate new candidate title and description (falling back to current values if omitted)
    new_title = update_data.get("title", entry.get("title", ""))
    new_desc = update_data.get("description", entry.get("description", ""))
    candidate_hash = passport_service.generate_content_hash(new_title, new_desc)
    
    current_hash = entry.get("content_hash", "")
    current_version = entry.get("version_number", 1)
    passport_id = entry.get("passport_id")

    if candidate_hash != current_hash:
        # Content has changed, trigger version increment and new snapshot
        new_version = current_version + 1
        update_data["content_hash"] = candidate_hash
        update_data["version_number"] = new_version
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # If the entry was un-migrated, ensure it gets a passport_id now
        if not passport_id:
            passport_id = await passport_service.get_unique_passport_id(db)
            update_data["passport_id"] = passport_id

        # Retrieve editor name for audit logging
        actor_name = "Contributor"
        user_doc = await db["users"].find_one({"_id": ObjectId(user_id)})
        if user_doc:
            actor_name = user_doc.get("name", "Contributor")

        # Execute OCC write validation inside a session transaction
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                result = await db["knowledge_entries"].update_one(
                    {
                        "_id": ObjectId(entry_id),
                        "version_number": current_version,
                        "content_hash": current_hash  # Dual OCC check (version + hash)
                    },
                    {"$set": update_data},
                    session=session
                )

                if result.modified_count == 0:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Knowledge entry was modified concurrently by another process. Please retry."
                    )

                # Create Version snapshot
                await passport_service.create_version_snapshot(
                    db=db,
                    entry_id=entry["_id"],
                    passport_id=passport_id,
                    version_number=new_version,
                    title=new_title,
                    description=new_desc,
                    content_hash=candidate_hash,
                    previous_hash=current_hash or None,
                    changed_by=ObjectId(user_id),
                    session=session
                )

                # Record REVISED event
                await passport_service.create_audit_event(
                    db=db,
                    entry_id=entry["_id"],
                    event_type="REVISED",
                    actor_id=ObjectId(user_id),
                    actor_name=actor_name,
                    description=f"Knowledge entry content revised to version {new_version}.",
                    metadata={"version_number": new_version, "content_hash": candidate_hash},
                    session=session
                )
    else:
        # Content remains the same (metadata update only), update database without version increment
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db["knowledge_entries"].update_one(
            {"_id": ObjectId(entry_id)},
            {"$set": update_data}
        )

    # Retrieve and return fresh copy
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

