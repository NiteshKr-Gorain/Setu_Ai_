import os
import logging
import traceback
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings
from app.services.transcription_service import transcribe_audio, TranscriptionError
from app.services.document_service import extract_text_from_document, DocumentExtractionError
from app.services.summarization_service import summarize_content, SummarizationError
from app.services.embedding_service import generate_embedding

logger = logging.getLogger(__name__)

ALLOWED_STAGES = {
    "queued",
    "preparing_source",
    "transcribing",
    "extracting_document",
    "summarizing",
    "saving_results",
    "completed",
    "failed"
}

async def update_processing_stage(db: AsyncIOMotorDatabase, entry_id: str, stage: str) -> None:
    """
    Validate and update the processing stage of a knowledge entry safely.
    """
    if stage not in ALLOWED_STAGES:
        raise ValueError(f"Invalid processing stage: {stage}")
        
    try:
        obj_id = ObjectId(entry_id)
    except Exception:
        logger.error(f"Invalid entry_id format: {entry_id}")
        return

    result = await db["knowledge_entries"].update_one(
        {"_id": obj_id},
        {"$set": {"processing_stage": stage, "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        logger.warning(f"Failed to update stage to {stage} because entry {entry_id} unexpectedly no longer exists.")

async def acquire_processing_slot(db: AsyncIOMotorDatabase, entry_id: str, user_id: str, is_retry: bool = False) -> bool:
    """
    Atomically acquire the processing slot for a knowledge entry.
    Ensures duplicate processing prevention and handles stale recovery.
    """
    now = datetime.now(timezone.utc)
    stale_cutoff = now - timedelta(minutes=settings.PROCESSING_STALE_MINUTES)
    
    filter_query = {
        "_id": ObjectId(entry_id),
        "contributor_id": ObjectId(user_id),
        "$and": [
            {
                "$or": [
                    {"processing_attempts": {"$lt": settings.MAX_PROCESSING_ATTEMPTS}},
                    {"processing_attempts": {"$exists": False}}
                ]
            },
            {
                "$or": [
                    {"status": {"$in": ["draft", "pending", "failed", "uploaded"]}},
                    {
                        "status": "processing",
                        "$or": [
                            {"processing_started_at": {"$lt": stale_cutoff}},
                            {"processing_started_at": {"$exists": False}},
                            {"processing_started_at": None}
                        ]
                    }
                ]
            }
        ]
    }
    
    update_fields = {
        "status": "processing",
        "processing_stage": "preparing_source",
        "error_message": None,
        "processing_started_at": now,
        "processing_completed_at": None,
        "updated_at": now
    }
    if is_retry:
        update_fields["last_retry_at"] = now

    update_query = {
        "$set": update_fields,
        "$inc": {"processing_attempts": 1}
    }
    
    result = await db["knowledge_entries"].find_one_and_update(
        filter_query,
        update_query,
        return_document=False  # Returns document BEFORE update
    )
    
    if result:
        if result.get("status") == "processing":
            logger.warning(f"Stale processing detected and recovered for entry {entry_id}. Previous started_at: {result.get('processing_started_at')}")
        return True
        
    return False

async def process_knowledge_entry(entry_id: str, db: AsyncIOMotorDatabase) -> None:
    """
    Background processing pipeline for knowledge entries (Phase 3C).
    """
    logger.info(f"Initiated background processing for entry_id: {entry_id}")
    
    try:
        obj_id = ObjectId(entry_id)
    except Exception as e:
        logger.error(f"Cannot parse entry_id {entry_id} to ObjectId: {e}")
        return

    # Fetch the entry to make sure it exists
    entry = await db["knowledge_entries"].find_one({"_id": obj_id})
    if not entry:
        logger.warning(f"Knowledge entry {entry_id} unexpectedly disappeared during processing.")
        return

    # Confirm status is processing
    if entry.get("status") != "processing":
        logger.error(f"Cannot process entry {entry_id} because its status is {entry.get('status')}, expected 'processing'.")
        return

    try:
        content_type = entry.get("content_type", "text")
        file_url = entry.get("file_url")
        existing_transcript = entry.get("transcript")
        
        has_valid_transcript = isinstance(existing_transcript, str) and len(existing_transcript.strip()) > 0
        source_text = ""
        
        # We start in preparing_source stage
        await update_processing_stage(db, entry_id, "preparing_source")
        
        if content_type in ("voice", "audio", "video"):
            if has_valid_transcript:
                source_text = existing_transcript
                logger.info(f"Reusing existing transcript for entry {entry_id}.")
            else:
                if not file_url:
                    raise TranscriptionError("No media file path associated with the knowledge entry.")
                
                # Update stage to transcribing
                await update_processing_stage(db, entry_id, "transcribing")
                
                # Call transcription service
                file_path = os.path.normpath(file_url)
                transcription_result = await transcribe_audio(file_path, content_type)
                source_text = transcription_result["transcript"]
                
                # Save transcript immediately
                trans_updates = {
                    "transcript": source_text,
                    "updated_at": datetime.now(timezone.utc)
                }
                if transcription_result.get("language"):
                    trans_updates["language"] = transcription_result["language"]
                
                res = await db["knowledge_entries"].update_one(
                    {"_id": obj_id},
                    {"$set": trans_updates}
                )
                if res.matched_count == 0:
                    logger.warning(f"Entry {entry_id} disappeared during processing (saving transcript). Stopping.")
                    return
                logger.info(f"Transcription saved immediately for entry {entry_id}.")
                
        elif content_type == "document":
            if has_valid_transcript:
                source_text = existing_transcript
                logger.info(f"Reusing existing document text for entry {entry_id}.")
            else:
                if not file_url:
                    raise DocumentExtractionError("No document file path associated with the knowledge entry.")
                    
                # Update stage to extracting_document
                await update_processing_stage(db, entry_id, "extracting_document")
                
                # Call document service
                file_path = os.path.normpath(file_url)
                _, ext = os.path.splitext(file_path)
                source_text = await extract_text_from_document(file_path, ext)
                
                # Save extracted text immediately
                res = await db["knowledge_entries"].update_one(
                    {"_id": obj_id},
                    {
                        "$set": {
                            "transcript": source_text,
                            "updated_at": datetime.now(timezone.utc)
                        }
                    }
                )
                if res.matched_count == 0:
                    logger.warning(f"Entry {entry_id} disappeared during processing (saving document text). Stopping.")
                    return
                logger.info(f"Document extraction saved immediately for entry {entry_id}.")
            
        elif content_type == "text":
            title = entry.get("title", "")
            description = entry.get("description", "")
            source_text = f"{title}\n{description}"
            
            # Save this source text in transcript
            res = await db["knowledge_entries"].update_one(
                {"_id": obj_id},
                {
                    "$set": {
                        "transcript": source_text,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            if res.matched_count == 0:
                logger.warning(f"Entry {entry_id} disappeared during processing (saving text transcript). Stopping.")
                return
            
        else:
            # Fallback for unknown content type
            source_text = entry.get("description", "") or ""
            res = await db["knowledge_entries"].update_one(
                {"_id": obj_id},
                {
                    "$set": {
                        "transcript": source_text,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            if res.matched_count == 0:
                logger.warning(f"Entry {entry_id} disappeared during processing (saving fallback transcript). Stopping.")
                return

        # Confirm source text is not empty
        if not source_text or not source_text.strip():
            raise SummarizationError("No usable content was available for processing.")

        # Update stage to summarizing
        await update_processing_stage(db, entry_id, "summarizing")

        # Call summarization service
        category = entry.get("category", "General")
        summary_result = await summarize_content(source_text, category)

        # Update stage to saving_results
        await update_processing_stage(db, entry_id, "saving_results")

        # Construct embedding source text from title, summary, and key insights
        title_val = entry.get("title", "")
        sum_val = summary_result["summary"]
        insights_val = summary_result["key_insights"]
        insights_joined = "\n".join([f"* {ins}" for ins in insights_val])
        
        embedding_source = f"Title: {title_val}\n\nSummary:\n{sum_val}\n\nKey Insights:\n{insights_joined}"
        
        embedding_vector = None
        if embedding_source.strip():
            try:
                embedding_vector = await generate_embedding(embedding_source)
            except Exception as emb_err:
                logger.error(f"Non-critical embedding generation failed for entry {entry_id}: {emb_err}")
                # Preserve existing valid embedding if any
                embedding_vector = entry.get("embedding")
        else:
            logger.warning(f"Embedding source text was empty for entry {entry_id}. Skipping embedding generation.")

        # Set status to completed and save updates
        final_updates = {
            "summary": sum_val,
            "key_insights": insights_val,
            "status": "completed",
            "processing_stage": "completed",
            "processing_completed_at": datetime.now(timezone.utc),
            "error_message": None,
            "updated_at": datetime.now(timezone.utc)
        }
        if embedding_vector is not None:
            final_updates["embedding"] = embedding_vector

        res = await db["knowledge_entries"].update_one(
            {"_id": obj_id},
            {"$set": final_updates}
        )
        if res.matched_count == 0:
            logger.warning(f"Entry {entry_id} disappeared during processing (saving final results). Stopping.")
            return
        logger.info(f"Background processing completed successfully for entry {entry_id}.")

    except TranscriptionError as te:
        logger.error(f"Transcription error during processing of entry {entry_id}: {te}")
        await _handle_processing_failure(
            obj_id, db, entry_id, 
            "Audio or video transcription could not be completed."
        )
    except DocumentExtractionError as dee:
        logger.error(f"Document extraction error during processing of entry {entry_id}: {dee}")
        await _handle_processing_failure(
            obj_id, db, entry_id, 
            "Document text could not be extracted."
        )
    except SummarizationError as se:
        logger.error(f"Summarization error during processing of entry {entry_id}: {se}", exc_info=True)
        await _handle_processing_failure(
            obj_id, db, entry_id,
            "AI summarization could not be completed. Please try again later."
        )
    except Exception as e:
        logger.error(f"Unexpected error encountered during background processing of entry {entry_id}: {e}")
        logger.error(traceback.format_exc())
        await _handle_processing_failure(
            obj_id, db, entry_id, 
            "Processing could not be completed due to an internal error."
        )

async def _handle_processing_failure(obj_id: ObjectId, db: AsyncIOMotorDatabase, entry_id: str, safe_message: str) -> None:
    try:
        now = datetime.now(timezone.utc)
        res = await db["knowledge_entries"].update_one(
            {"_id": obj_id},
            {
                "$set": {
                    "status": "failed",
                    "processing_stage": "failed",
                    "processing_completed_at": now,
                    "error_message": safe_message,
                    "updated_at": now
                }
            }
        )
        if res.matched_count == 0:
            logger.warning(f"Failed to set status to 'failed' because entry {entry_id} unexpectedly no longer exists.")
            return
        logger.info(f"Entry {entry_id} status updated to 'failed' with error_message: {safe_message}")
    except Exception as save_err:
        logger.critical(f"Failed to set status to 'failed' for entry {entry_id}: {save_err}")
