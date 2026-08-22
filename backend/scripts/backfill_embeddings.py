import os
import sys
import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient

# Add backend directory to path
sys.path.append(os.path.normpath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.services.embedding_service import generate_embedding

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

async def backfill():
    logger.info("Initializing database connection...")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]
    
    logger.info("Fetching completed entries missing embeddings...")
    # Find status="completed" and embedding missing or null
    query = {
        "status": "completed",
        "$or": [
            {"embedding": None},
            {"embedding": {"$exists": False}},
            {"embedding": {"$size": 0}}
        ]
    }
    
    cursor = db["knowledge_entries"].find(query)
    entries = await cursor.to_list(length=10000)
    
    total_count = len(entries)
    logger.info(f"Found {total_count} entries to backfill.")
    
    processed = 0
    skipped = 0
    success = 0
    failed = 0
    
    for entry in entries:
        entry_id = str(entry["_id"])
        title = entry.get("title", "")
        summary = entry.get("summary", "")
        insights = entry.get("key_insights", [])
        
        # Check if useful content exists
        if not title and not summary and not insights:
            logger.warning(f"Skipping entry {entry_id} because it has no useful title, summary, or insights.")
            skipped += 1
            processed += 1
            continue
            
        insights_joined = "\n".join([f"* {ins}" for ins in insights])
        embedding_source = f"Title: {title}\n\nSummary:\n{summary}\n\nKey Insights:\n{insights_joined}"
        
        if not embedding_source.strip():
            logger.warning(f"Skipping entry {entry_id} due to empty combined source text.")
            skipped += 1
            processed += 1
            continue
            
        logger.info(f"Generating embedding for entry {entry_id} ({processed + 1}/{total_count})...")
        try:
            vector = await generate_embedding(embedding_source)
            res = await db["knowledge_entries"].update_one(
                {"_id": entry["_id"]},
                {"$set": {"embedding": vector}}
            )
            if res.modified_count > 0:
                success += 1
                logger.info(f"Successfully backfilled entry {entry_id}.")
            else:
                failed += 1
                logger.error(f"Failed to update entry {entry_id} in database.")
        except Exception as e:
            failed += 1
            logger.error(f"Failed to generate/save embedding for entry {entry_id}: {e}")
            
        processed += 1
        # Low concurrency/rate limit protection
        await asyncio.sleep(0.5)
        
    logger.info("=== Backfill Complete ===")
    logger.info(f"Total processed: {processed}")
    logger.info(f"Skipped: {skipped}")
    logger.info(f"Success: {success}")
    logger.info(f"Failed: {failed}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(backfill())
