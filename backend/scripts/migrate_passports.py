import asyncio
import logging
import sys
import os

# Add root folder to python path so app can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.services import passport_service
from bson import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

async def run_migration():
    logger.info("Starting database migration for Knowledge Passport...")
    
    mongo_uri = settings.MONGO_URI
    db_name = settings.MONGO_DB_NAME
    
    client = AsyncIOMotorClient(mongo_uri)
    db = client[db_name]
    
    # Fetch all entries in the collection
    cursor = db["knowledge_entries"].find({})
    entries = await cursor.to_list(length=10000)
    
    logger.info(f"Found {len(entries)} total knowledge entries to check/migrate.")
    
    migrated_count = 0
    checked_count = 0
    
    for doc in entries:
        checked_count += 1
        entry_id = doc["_id"]
        title = doc.get("title", "")
        description = doc.get("description", "")
        contributor_id = doc.get("contributor_id")
        
        # Determine contributor info
        actor_name = "Contributor"
        actor_obj_id = contributor_id if contributor_id else ObjectId("000000000000000000000000")
        if contributor_id:
            user_doc = await db["users"].find_one({"_id": contributor_id})
            if user_doc:
                actor_name = user_doc.get("name", "Contributor")
        
        try:
            # 1. Check/Determine passport_id
            passport_id = doc.get("passport_id")
            passport_needed_update = False
            if not passport_id:
                passport_id = await passport_service.get_unique_passport_id(db)
                passport_needed_update = True
            
            # 2. Check/Determine content_hash
            content_hash = doc.get("content_hash")
            hash_needed_update = False
            if not content_hash:
                content_hash = passport_service.generate_content_hash(title, description)
                hash_needed_update = True
            
            # 3. Check/Determine version_number
            version_number = doc.get("version_number")
            version_needed_update = False
            if not version_number:
                version_number = 1
                version_needed_update = True
            
            # 4. Check Version 1 snapshot existence
            existing_v1 = await db["knowledge_versions"].find_one({
                "entry_id": entry_id,
                "version_number": 1
            })
            v1_needed_insert = (existing_v1 is None)
            
            # 5. Check baseline CREATED audit event existence
            existing_created = await db["knowledge_audit_trail"].find_one({
                "entry_id": entry_id,
                "event_type": "CREATED"
            })
            created_needed_insert = (existing_created is None)
            
            # If nothing is missing, skip to next entry
            if not (passport_needed_update or hash_needed_update or version_needed_update or v1_needed_insert or created_needed_insert):
                continue
                
            logger.info(f"Entry {entry_id} needs: passport={passport_needed_update}, hash={hash_needed_update}, version={version_needed_update}, v1={v1_needed_insert}, created={created_needed_insert}")
            
            # Perform updates/inserts inside a MongoDB transaction session
            async with await client.start_session() as session:
                async with session.start_transaction():
                    # Update fields in knowledge_entries if needed
                    updates = {}
                    if passport_needed_update:
                        updates["passport_id"] = passport_id
                    if hash_needed_update:
                        updates["content_hash"] = content_hash
                    if version_needed_update:
                        updates["version_number"] = version_number
                        
                    if updates:
                        await db["knowledge_entries"].update_one(
                            {"_id": entry_id},
                            {"$set": updates},
                            session=session
                        )
                        
                    # Create Version 1 snapshot if needed
                    if v1_needed_insert:
                        await passport_service.create_version_snapshot(
                            db=db,
                            entry_id=entry_id,
                            passport_id=passport_id,
                            version_number=1,
                            title=title,
                            description=description,
                            content_hash=content_hash,
                            previous_hash=None,
                            changed_by=actor_obj_id,
                            session=session
                        )
                        
                    # Create baseline CREATED audit event if needed
                    if created_needed_insert:
                        await passport_service.create_audit_event(
                            db=db,
                            entry_id=entry_id,
                            event_type="CREATED",
                            actor_id=actor_obj_id,
                            actor_name=actor_name,
                            description=f"Knowledge entry initialized with Passport ID during system migration: {passport_id}.",
                            metadata={"version_number": 1, "content_hash": content_hash},
                            session=session
                        )
            
            migrated_count += 1
            logger.info(f"Idempotent check updated entry {entry_id} -> Passport ID: {passport_id}")
            
        except Exception as err:
            logger.error(f"Failed to process/migrate entry {entry_id}: {err}")
            
    logger.info(f"Migration completed. Checked: {checked_count}, Patched/Migrated: {migrated_count}")
    client.close()

if __name__ == "__main__":
    asyncio.run(run_migration())
