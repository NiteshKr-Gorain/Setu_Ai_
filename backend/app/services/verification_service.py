import logging
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

async def recompute_entry_trust(db: AsyncIOMotorDatabase, entry_id: str) -> dict:
    """
    Recompute the aggregate trust score and verification count from the current verifications.
    """
    try:
        obj_id = ObjectId(entry_id)
    except Exception:
        logger.error(f"Invalid entry_id format: {entry_id}")
        return {"trust_score": 0.0, "verification_count": 0}
        
    verification_count = await db["knowledge_verifications"].count_documents({"entry_id": obj_id})
    
    if verification_count == 0:
        trust_score = 0.0
    else:
        verified_count = await db["knowledge_verifications"].count_documents({
            "entry_id": obj_id,
            "trust_level": "verified"
        })
        trust_score = float(verified_count) / float(verification_count)
        
    res = await db["knowledge_entries"].update_one(
        {"_id": obj_id},
        {
            "$set": {
                "trust_score": trust_score,
                "verification_count": verification_count
            }
        }
    )
    if res.matched_count == 0:
        logger.warning(f"Knowledge entry {entry_id} no longer exists. Not recreating.")
        
    return {"trust_score": trust_score, "verification_count": verification_count}
