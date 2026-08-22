from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query, status, HTTPException, BackgroundTasks, File, UploadFile, Form
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.config import settings
from app.database import get_database
from app.core.dependencies import get_current_user
from app.models.knowledge_entry import KnowledgeEntryCreate, KnowledgeEntryUpdate, KnowledgeEntryOut, CategoryType
from app.services import knowledge_service
from app.services.file_service import save_upload_file
from app.services.processing_service import process_knowledge_entry, acquire_processing_slot


router = APIRouter(prefix="/knowledge", tags=["knowledge"])

@router.post("", response_model=KnowledgeEntryOut, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry_in: KnowledgeEntryCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new knowledge entry.
    
    Associates the entry's contributor_id with the ID of the currently logged-in user.
    """
    if entry_in.community_id:
        try:
            comm_obj_id = ObjectId(entry_in.community_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid community ID format.")
        comm = await db["communities"].find_one({"_id": comm_obj_id})
        if not comm:
            raise HTTPException(status_code=400, detail="Community not found.")

    contributor_id = str(current_user["_id"])
    entry = await knowledge_service.create_knowledge_entry(db, contributor_id, entry_in)
    
    # Acquire processing slot atomically and schedule processing
    entry_id = str(entry["_id"])
    acquired = await acquire_processing_slot(db, entry_id, contributor_id)
    if acquired:
        background_tasks.add_task(process_knowledge_entry, entry_id, db)
        # Fetch updated entry to return with correct fields
        entry = await knowledge_service.get_knowledge_entry_by_id(db, entry_id)
        
    return entry

def validate_lang_param(lang: Optional[str]) -> Optional[str]:
    if lang is None:
        return None
    if len(lang) != 2 or not lang.islower() or not lang.isalpha():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Language code must be a 2-character lowercase ISO code (e.g. en, hi, es)."
        )
    return lang

async def translate_entry_if_needed(entry: dict, lang: Optional[str], db: AsyncIOMotorDatabase) -> dict:
    if not lang:
        return entry
    orig_lang = entry.get("language", "en")
    if orig_lang == lang:
        return entry
        
    translations = entry.get("translations", {})
    cached = translations.get(lang)
    
    if cached and cached.get("source_updated_at") == entry.get("updated_at"):
        entry["title"] = cached.get("title", entry.get("title", ""))
        entry["summary"] = cached.get("summary", entry.get("summary", ""))
        entry["key_insights"] = cached.get("key_insights", entry.get("key_insights", []))
        return entry
        
    try:
        from app.services.translation_service import translate_text
        import asyncio
        
        title_val = entry.get("title", "")
        sum_val = entry.get("summary", "")
        insights_val = entry.get("key_insights", [])
        
        tasks = []
        tasks.append(translate_text(title_val, target_language=lang) if title_val else asyncio.to_thread(lambda: ""))
        tasks.append(translate_text(sum_val, target_language=lang) if sum_val else asyncio.to_thread(lambda: ""))
        for ins in insights_val:
            tasks.append(translate_text(ins, target_language=lang) if ins else asyncio.to_thread(lambda: ""))
            
        results = await asyncio.gather(*tasks)
        translated_title = results[0]
        translated_sum = results[1]
        translated_insights = list(results[2:])
        
        cache_entry = {
            "title": translated_title,
            "summary": translated_sum,
            "key_insights": translated_insights,
            "source_updated_at": entry.get("updated_at")
        }
        
        await db["knowledge_entries"].update_one(
            {"_id": entry["_id"]},
            {"$set": {f"translations.{lang}": cache_entry}}
        )
        
        entry["title"] = translated_title
        entry["summary"] = translated_sum
        entry["key_insights"] = translated_insights
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Translation failed for entry {entry.get('_id')} to {lang}: {e}")
        
    return entry

@router.get("", response_model=List[KnowledgeEntryOut])
async def list_entries(
    category: Optional[CategoryType] = Query(None, description="Filter by category"),
    contributor_id: Optional[str] = Query(None, description="Filter by contributor ID"),
    skip: int = Query(0, ge=0, description="Skip entries for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Limit result count"),
    lang: Optional[str] = Query(None, description="Preferred language code"),
    community_id: Optional[str] = Query(None, description="Filter by community ID"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    List knowledge entries.
    
    Supports filtering by category and contributor ID, with pagination skip and limit.
    """
    validated_lang = validate_lang_param(lang)
    entries = await knowledge_service.get_knowledge_entries(
        db, category=category, contributor_id=contributor_id, skip=skip, limit=limit, community_id=community_id
    )
    if validated_lang:
        for idx in range(len(entries)):
            if entries[idx].get("status") == "completed":
                entries[idx] = await translate_entry_if_needed(entries[idx], validated_lang, db)
    return entries

@router.get("/{id}", response_model=KnowledgeEntryOut)
async def get_entry(
    id: str,
    lang: Optional[str] = Query(None, description="Preferred language code"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a single knowledge entry details.
    
    Raises 404 error if the entry cannot be found by ID.
    """
    validated_lang = validate_lang_param(lang)
    entry = await knowledge_service.get_knowledge_entry_by_id(db, id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge entry not found"
        )
    if validated_lang:
        if entry.get("status") == "completed":
            entry = await translate_entry_if_needed(entry, validated_lang, db)
    return entry

@router.put("/{id}", response_model=KnowledgeEntryOut)
async def update_entry(
    id: str,
    entry_in: KnowledgeEntryUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Update a knowledge entry.
    
    Requires the current authenticated user to be the original contributor of the entry.
    """
    user_id = str(current_user["_id"])
    entry = await knowledge_service.update_knowledge_entry(db, id, user_id, entry_in)
    return entry

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete a knowledge entry.
    
    Requires the current authenticated user to be the original contributor of the entry.
    """
    user_id = str(current_user["_id"])
    await knowledge_service.delete_knowledge_entry(db, id, user_id)
    return None

@router.post("/{id}/upload", response_model=KnowledgeEntryOut)
async def upload_file(
    id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    content_type: Literal["voice", "video", "document"] = Form(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Upload a media/document file associated with a knowledge entry.
    
    Only the entry's contributor can upload to it.
    Validates file via file_service, saves it, updates entry with file details,
    sets status to 'uploaded', and triggers background processing.
    """
    entry = await knowledge_service.get_knowledge_entry_by_id(db, id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge entry not found"
        )
        
    if str(entry["contributor_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload files to this knowledge entry"
        )

    # Save file and validate content-type and size via file_service
    file_url, file_size_bytes = await save_upload_file(
        file=file,
        content_type=content_type,
        contributor_id=str(current_user["_id"]),
        entry_id=id
    )

    # Update knowledge entry status and fields
    now = datetime.now(timezone.utc)
    await db["knowledge_entries"].update_one(
        {"_id": ObjectId(id)},
        {
            "$set": {
                "file_url": file_url,
                "content_type": content_type,
                "file_size_bytes": file_size_bytes,
                "updated_at": now
            }
        }
    )

    # Acquire the processing slot atomically
    acquired = await acquire_processing_slot(db, id, str(current_user["_id"]))
    if acquired:
        background_tasks.add_task(process_knowledge_entry, id, db)

    # Fetch the updated entry
    updated_entry = await knowledge_service.get_knowledge_entry_by_id(db, id)
    return updated_entry

@router.get("/{id}/status")
async def get_entry_status(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get the processing status of a knowledge entry (lightweight endpoint for polling).
    """
    entry = await knowledge_service.get_knowledge_entry_by_id(db, id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge entry not found"
        )
        
    attempts = entry.get("processing_attempts", 0)
    max_attempts = settings.MAX_PROCESSING_ATTEMPTS
    attempts_remain = attempts < max_attempts
    
    status_val = entry.get("status", "draft")
    is_failed = status_val == "failed"
    
    is_stale = False
    if status_val == "processing":
        started_at = entry.get("processing_started_at")
        if not started_at:
            is_stale = True
        else:
            now = datetime.now(timezone.utc)
            stale_cutoff = now - timedelta(minutes=settings.PROCESSING_STALE_MINUTES)
            is_stale = started_at < stale_cutoff
            
    can_retry = attempts_remain and (is_failed or is_stale)
    
    return {
        "id": id,
        "status": status_val,
        "processing_stage": entry.get("processing_stage"),
        "processing_attempts": attempts,
        "processing_started_at": entry.get("processing_started_at"),
        "processing_completed_at": entry.get("processing_completed_at"),
        "last_retry_at": entry.get("last_retry_at"),
        "error_message": entry.get("error_message"),
        "can_retry": can_retry
    }

@router.post("/{id}/retry", status_code=status.HTTP_202_ACCEPTED)
async def retry_entry(
    id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Retry a failed or stale background processing job for a knowledge entry.
    """
    user_id = str(current_user["_id"])
    
    # 1. Fetch the entry first to verify existence and ownership safely
    entry = await knowledge_service.get_knowledge_entry_by_id(db, id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge entry not found"
        )
        
    if str(entry["contributor_id"]) != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge entry not found"
        )
        
    status_val = entry.get("status", "draft")
    attempts = entry.get("processing_attempts", 0)
    
    # 2. Check maximum attempts limit
    if attempts >= settings.MAX_PROCESSING_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Maximum processing attempts reached."
        )
        
    # 3. Reject completed entries
    if status_val == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed knowledge entries cannot be retried."
        )
        
    # 4. Reject active processing (unless stale)
    if status_val == "processing":
        started_at = entry.get("processing_started_at")
        is_stale = False
        if not started_at:
            is_stale = True
        else:
            now = datetime.now(timezone.utc)
            stale_cutoff = now - timedelta(minutes=settings.PROCESSING_STALE_MINUTES)
            is_stale = started_at < stale_cutoff
            
        if not is_stale:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Entry is already actively processing."
            )
            
    # 5. Acquire the processing slot atomically
    acquired = await acquire_processing_slot(db, id, user_id, is_retry=True)
    if not acquired:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not acquire processing slot. It might be already processing."
        )
        
    # 6. Schedule background processing
    background_tasks.add_task(process_knowledge_entry, id, db)
    
    # Fetch updated entry to return the correct count in response
    updated_entry = await knowledge_service.get_knowledge_entry_by_id(db, id)
    
    return {
        "message": "Retry scheduled successfully.",
        "entry_id": id,
        "status": updated_entry.get("status"),
        "processing_stage": updated_entry.get("processing_stage"),
        "processing_attempts": updated_entry.get("processing_attempts", 0)
    }


