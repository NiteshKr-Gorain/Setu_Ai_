import hashlib
import secrets
import logging
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.knowledge_entry import KnowledgeEntryCreate

logger = logging.getLogger(__name__)

# Exclude confusing chars: O, 0, I, l
PASS_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789"

def generate_passport_id() -> str:
    """Generates a cryptographically secure random alphanumeric string of length 8."""
    code = "".join(secrets.choice(PASS_CHARS) for _ in range(8))
    return f"SETU-KNOW-{code}"

async def get_unique_passport_id(db: AsyncIOMotorDatabase) -> str:
    """Generates a passport_id and ensures it is unique in the database."""
    for _ in range(10): # try up to 10 times to prevent lockups
        pid = generate_passport_id()
        existing = await db["knowledge_entries"].find_one({"passport_id": pid})
        if not existing:
            return pid
    raise RuntimeError("Failed to generate a unique passport_id")

def generate_content_hash(title: str, description: str) -> str:
    """Generates a deterministic SHA-256 hash from canonical title and description text."""
    norm_title = title.replace("\r\n", "\n").replace("\r", "\n").strip()
    norm_desc = description.replace("\r\n", "\n").replace("\r", "\n").strip()
    canonical = f"title:{norm_title}\ncontent:{norm_desc}"
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

async def create_audit_event(
    db: AsyncIOMotorDatabase,
    entry_id: ObjectId,
    event_type: str,
    actor_id: ObjectId,
    actor_name: str,
    description: str,
    metadata: Optional[dict] = None,
    session=None
) -> dict:
    """Writes an audit timeline event to the knowledge_audit_trail collection."""
    event = {
        "entry_id": entry_id,
        "event_type": event_type,
        "actor_id": actor_id,
        "actor_name": actor_name,
        "description": description,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc)
    }
    await db["knowledge_audit_trail"].insert_one(event, session=session)
    return event

async def create_version_snapshot(
    db: AsyncIOMotorDatabase,
    entry_id: ObjectId,
    passport_id: str,
    version_number: int,
    title: str,
    description: str,
    content_hash: str,
    previous_hash: Optional[str],
    changed_by: ObjectId,
    session=None
) -> dict:
    """Writes a historical version snapshot to the knowledge_versions collection."""
    snapshot = {
        "entry_id": entry_id,
        "passport_id": passport_id,
        "version_number": version_number,
        "title": title,
        "description": description,
        "content_hash": content_hash,
        "previous_hash": previous_hash,
        "changed_by": changed_by,
        "created_at": datetime.now(timezone.utc)
    }
    await db["knowledge_versions"].insert_one(snapshot, session=session)
    return snapshot

async def save_knowledge_version(
    db: AsyncIOMotorDatabase,
    article_id: ObjectId,
    content: str,
    changed_by: ObjectId,
    change_summary: str = "Initial version",
    citations: List[str] = None,
    source: str = "web",
    session=None
) -> dict:
    """
    Saves a new knowledge version. Recomputes SHA-256 server-side, 
    increments version number, builds provenance, and inserts a new document.
    """
    # 1. Compute SHA-256 server-side
    sha256_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
    
    # 2. Determine next version number
    last_version = await db["knowledge_versions"].find_one(
        {"entry_id": article_id},
        sort=[("version_number", -1)],
        session=session
    )
    next_ver = 1
    if last_version:
        next_ver = last_version.get("version_number", 1) + 1
        
    now = datetime.now(timezone.utc)
    if "ai" in (source or "").lower():
        action_type = "ai_generated" if next_ver == 1 else "ai_assisted_edit"
    else:
        action_type = "created" if next_ver == 1 else "edited"
    
    # Resolve creator or carry forward
    if next_ver == 1:
        creator_id = changed_by
        historical_logs = []
    else:
        prev_prov = last_version.get("provenance", {}) if last_version else {}
        creator_id = prev_prov.get("created_by") or last_version.get("created_by") or changed_by
        historical_logs = prev_prov.get("activity_log", [])
        
    activity_log = list(historical_logs) + [
        {
            "action": action_type,
            "actor": str(changed_by),
            "timestamp": now
        }
    ]
    
    provenance = {
        "source": source,
        "created_by": creator_id,
        "modified_by": changed_by,
        "verified_by": None,
        "activity_log": activity_log
    }
    
    version_doc = {
        "article_id": article_id,
        "entry_id": article_id,  # Keep backward compatibility
        "version_number": next_ver,
        "content": content,
        "sha256_hash": sha256_hash,
        "created_by": creator_id,
        "modified_by": changed_by,
        "created_at": now,
        "modified_at": now,
        "change_summary": change_summary,
        "verification_status": "unverified",
        "citations": citations or [],
        "source": source,
        "provenance": provenance
    }
    
    await db["knowledge_versions"].insert_one(version_doc, session=session)
    return version_doc

async def verify_version_integrity(
    db: AsyncIOMotorDatabase,
    article_id: ObjectId,
    version_number: int
) -> tuple[bool, str, str]:
    """
    Recomputes the hash from stored content and compares it to recorded hash.
    Returns (verified, computed_hash, recorded_hash).
    """
    version_doc = await db["knowledge_versions"].find_one({
        "entry_id": article_id,
        "version_number": version_number
    })
    if not version_doc:
        raise ValueError(f"Version {version_number} not found for article {article_id}.")
        
    content = version_doc.get("content", "")
    recorded_hash = version_doc.get("sha256_hash", "")
    
    computed_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
    verified = (computed_hash == recorded_hash)
    
    return verified, computed_hash, recorded_hash

async def get_version_history(
    db: AsyncIOMotorDatabase,
    article_id: ObjectId,
    skip: int = 0,
    limit: int = 50
) -> List[dict]:
    """
    Retrieves historical lightweight snapshots for an article sorted newest-first,
    excluding full content string and applying skip/limit pagination.
    """
    cursor = db["knowledge_versions"].find(
        {"entry_id": article_id},
        projection={"content": False}
    ).sort("version_number", -1).skip(skip).limit(limit)
    
    return await cursor.to_list(length=limit)

async def get_version_detail(
    db: AsyncIOMotorDatabase,
    article_id: ObjectId,
    version_number: int
) -> Optional[dict]:
    """
    Retrieves a single full version snapshot including content.
    """
    return await db["knowledge_versions"].find_one({
        "entry_id": article_id,
        "version_number": version_number
    })

async def verify_version(
    db: AsyncIOMotorDatabase,
    article_id: ObjectId,
    version_number: int,
    reviewer_id: ObjectId,
    session=None
) -> dict:
    """
    Marks a version as verified, records the verified_by agent, and appends a verified action to the activity_log.
    """
    version_doc = await db["knowledge_versions"].find_one({
        "entry_id": article_id,
        "version_number": version_number
    }, session=session)
    
    if not version_doc:
        raise ValueError(f"Version {version_number} not found for article {article_id}.")
        
    now = datetime.now(timezone.utc)
    prov = version_doc.get("provenance", {}) or {}
    activity_log = prov.get("activity_log", []) or []
    
    # Append verified log
    updated_activity_log = list(activity_log) + [
        {
            "action": "verified",
            "actor": str(reviewer_id),
            "timestamp": now
        }
    ]
    
    await db["knowledge_versions"].update_one(
        {"_id": version_doc["_id"]},
        {
            "$set": {
                "verification_status": "verified",
                "provenance.verified_by": reviewer_id,
                "provenance.activity_log": updated_activity_log
            }
        },
        session=session
    )
    
    version_doc["verification_status"] = "verified"
    if "provenance" not in version_doc:
        version_doc["provenance"] = {}
    version_doc["provenance"]["verified_by"] = reviewer_id
    version_doc["provenance"]["activity_log"] = updated_activity_log
    
    return version_doc

async def get_provenance_chain(
    db: AsyncIOMotorDatabase,
    article_id: ObjectId
) -> dict:
    """
    Returns a formatted provenance chain for the article's current/latest version.
    """
    latest_ver = await db["knowledge_versions"].find_one(
        {"entry_id": article_id},
        sort=[("version_number", -1)]
    )
    if not latest_ver:
        raise ValueError(f"No version logs found for article {article_id}.")
        
    prov = latest_ver.get("provenance", {}) or {}
    created_by_id = prov.get("created_by") or latest_ver.get("created_by")
    modified_by_id = prov.get("modified_by") or latest_ver.get("modified_by")
    verified_by_id = prov.get("verified_by")
    
    # Resolve names
    async def get_user_name(uid):
        if not uid:
            return None
        u = await db["users"].find_one({"_id": ObjectId(uid)})
        return u.get("name") if u else str(uid)
        
    created_by_name = await get_user_name(created_by_id) or "Unknown Creator"
    modified_by_name = await get_user_name(modified_by_id) or "Unknown Modifier"
    verified_by_name = await get_user_name(verified_by_id) if verified_by_id else None
    
    return {
        "article_id": article_id,
        "version_number": latest_ver.get("version_number", 1),
        "created_by": created_by_name,
        "modified_by": modified_by_name,
        "verified_by": verified_by_name,
        "citations": latest_ver.get("citations", []),
        "activity_log": prov.get("activity_log", [])
    }


