"""
Service Layer for RFID / NFC Card Scanning, Hardware Tap Dispatching, and Identity Binding.
"""
from datetime import datetime, timezone
import logging
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.rfid import (
    RFIDScanIn,
    RFIDScanOut,
    RFIDBindUserIn,
    RFIDBindKnowledgeIn,
    RFIDAuthData,
    RFIDKnowledgeData
)
from app.models.user import UserOut
from app.core.security import create_access_token, create_refresh_token, get_password_hash

logger = logging.getLogger(__name__)

def normalize_tag_uid(tag_uid: str) -> str:
    """Normalize RFID / NFC tag string to uppercase trimmed format."""
    if not tag_uid:
        return ""
    return tag_uid.strip().upper()

async def log_rfid_scan(
    db: AsyncIOMotorDatabase,
    tag_uid: str,
    device_id: Optional[str],
    reader_type: Optional[str],
    action_taken: str,
    scan_status: str,
    metadata: Optional[Dict[str, Any]] = None
):
    """Record an audit entry into rfid_scan_logs."""
    try:
        log_entry = {
            "tag_uid": tag_uid,
            "device_id": device_id or "village-kiosk-main",
            "reader_type": reader_type or "usb_wedge",
            "action_taken": action_taken,
            "status": scan_status,
            "timestamp": datetime.now(timezone.utc),
            "metadata": metadata or {}
        }
        await db["rfid_scan_logs"].insert_one(log_entry)
    except Exception as e:
        logger.warning(f"Failed to record RFID scan log: {e}")

async def process_rfid_scan(db: AsyncIOMotorDatabase, scan_in: RFIDScanIn) -> RFIDScanOut:
    """
    Process an incoming RFID / NFC scan event.
    Resolves whether the tag is a User Identity Smart Card, Knowledge Passport Tag, or Unregistered.
    """
    tag_uid = normalize_tag_uid(scan_in.tag_uid)
    now = datetime.now(timezone.utc)

    # 1. Lookup in registered rfid_tags collection
    tag_doc = await db["rfid_tags"].find_one({"tag_uid": tag_uid})

    # Fallback 1: Check users collection directly if tag_doc missing
    if not tag_doc:
        user_by_card = await db["users"].find_one({"rfid_card_uid": tag_uid})
        if user_by_card:
            tag_doc = {
                "tag_uid": tag_uid,
                "tag_type": "user_card",
                "label": f"Smart Badge for {user_by_card.get('name')}",
                "user_id": user_by_card["_id"],
                "created_at": now,
                "scan_count": 0
            }
            await db["rfid_tags"].update_one(
                {"tag_uid": tag_uid},
                {"$set": tag_doc},
                upsert=True
            )

    # Fallback 2: Check knowledge_entries collection directly if tag_doc missing
    if not tag_doc:
        entry_by_card = await db["knowledge_entries"].find_one({"rfid_tag_uid": tag_uid})
        if entry_by_card:
            tag_doc = {
                "tag_uid": tag_uid,
                "tag_type": "knowledge_passport",
                "label": f"Physical Tag: {entry_by_card.get('title')}",
                "entry_id": entry_by_card["_id"],
                "created_at": now,
                "scan_count": 0
            }
            await db["rfid_tags"].update_one(
                {"tag_uid": tag_uid},
                {"$set": tag_doc},
                upsert=True
            )

    # If still not found -> Unregistered Tag
    if not tag_doc:
        await log_rfid_scan(
            db,
            tag_uid=tag_uid,
            device_id=scan_in.device_id,
            reader_type=scan_in.reader_type,
            action_taken="unregistered_tag_detected",
            scan_status="unregistered"
        )
        return RFIDScanOut(
            status="unregistered",
            action="bind_prompt",
            tag_uid=tag_uid,
            tag_type="generic",
            label="Unregistered RFID Tag",
            message=f"RFID Tag '{tag_uid}' is not linked to any user badge or knowledge artifact. You can link it now.",
            scanned_at=now
        )

    tag_type = tag_doc.get("tag_type", "generic")

    # 2. Handle User Smart Card (Tap-to-Login)
    if tag_type in ("user_card", "kiosk_badge"):
        user_id = tag_doc.get("user_id")
        user = None
        if user_id:
            user_obj_id = ObjectId(user_id) if isinstance(user_id, str) and ObjectId.is_valid(user_id) else user_id
            user = await db["users"].find_one({"_id": user_obj_id})

        if not user:
            # Tag points to a deleted or invalid user
            return RFIDScanOut(
                status="unregistered",
                action="bind_prompt",
                tag_uid=tag_uid,
                tag_type=tag_type,
                label=tag_doc.get("label", "Orphaned Badge"),
                message=f"The user linked to RFID card '{tag_uid}' was not found. Please pair the card again.",
                scanned_at=now
            )

        # Generate JWT Access & Refresh Tokens
        token_payload = {
            "sub": str(user["_id"]),
            "email": user["email"]
        }
        access_token = create_access_token(token_payload)
        refresh_token = create_refresh_token({"sub": str(user["_id"])})

        # Update stats
        await db["rfid_tags"].update_one(
            {"tag_uid": tag_uid},
            {
                "$set": {"last_scanned_at": now},
                "$inc": {"scan_count": 1}
            }
        )

        user_out = UserOut(
            _id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            role=user.get("role", "contributor"),
            preferred_language=user.get("preferred_language", "en"),
            created_at=user.get("created_at", now)
        )

        auth_data = RFIDAuthData(
            user=user_out,
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )

        await log_rfid_scan(
            db,
            tag_uid=tag_uid,
            device_id=scan_in.device_id,
            reader_type=scan_in.reader_type,
            action_taken="user_login_tap",
            scan_status="authenticated",
            metadata={"user_id": str(user["_id"]), "user_name": user["name"]}
        )

        return RFIDScanOut(
            status="authenticated",
            action="login",
            tag_uid=tag_uid,
            tag_type=tag_type,
            label=tag_doc.get("label", f"Badge: {user['name']}"),
            message=f"Welcome back, {user['name']}! RFID Smart Card authenticated successfully.",
            auth_data=auth_data,
            scanned_at=now
        )

    # 3. Handle Knowledge Passport Physical Tag
    elif tag_type == "knowledge_passport":
        entry_id = tag_doc.get("entry_id")
        entry = None
        if entry_id:
            entry_obj_id = ObjectId(entry_id) if isinstance(entry_id, str) and ObjectId.is_valid(entry_id) else entry_id
            entry = await db["knowledge_entries"].find_one({"_id": entry_obj_id})

        if not entry:
            # Try searching by passport_id or title
            passport_id_query = tag_doc.get("passport_id")
            if passport_id_query:
                entry = await db["knowledge_entries"].find_one({"passport_id": passport_id_query})

        if not entry:
            return RFIDScanOut(
                status="unregistered",
                action="bind_prompt",
                tag_uid=tag_uid,
                tag_type=tag_type,
                label=tag_doc.get("label", "Orphaned Artifact Tag"),
                message=f"The knowledge entry for physical tag '{tag_uid}' was not found. You can link a new entry.",
                scanned_at=now
            )

        # Update stats
        await db["rfid_tags"].update_one(
            {"tag_uid": tag_uid},
            {
                "$set": {"last_scanned_at": now},
                "$inc": {"scan_count": 1}
            }
        )

        # Fetch contributor name if available
        contributor_name = "Elder Contributor"
        contrib_id = entry.get("contributor_id")
        if contrib_id:
            c_obj_id = ObjectId(contrib_id) if isinstance(contrib_id, str) and ObjectId.is_valid(contrib_id) else contrib_id
            c_user = await db["users"].find_one({"_id": c_obj_id})
            if c_user:
                contributor_name = c_user.get("name", "Elder Contributor")

        knowledge_data = RFIDKnowledgeData(
            id=str(entry["_id"]),
            passport_id=entry.get("passport_id", f"SETU-PASSPORT-{str(entry['_id'])[:6].upper()}"),
            title=entry.get("title", "Untitled Knowledge Artifact"),
            category=entry.get("category", "General"),
            description=entry.get("description", ""),
            contributor_name=contributor_name,
            status=entry.get("status", "completed"),
            trust_score=entry.get("trust_score", 1.0),
            verification_count=entry.get("verification_count", 0),
            created_at=entry.get("created_at", now)
        )

        await log_rfid_scan(
            db,
            tag_uid=tag_uid,
            device_id=scan_in.device_id,
            reader_type=scan_in.reader_type,
            action_taken="view_knowledge_passport",
            scan_status="knowledge_retrieved",
            metadata={"entry_id": str(entry["_id"]), "title": entry.get("title")}
        )

        return RFIDScanOut(
            status="knowledge_retrieved",
            action="view_knowledge",
            tag_uid=tag_uid,
            tag_type=tag_type,
            label=tag_doc.get("label", f"Artifact: {entry.get('title')}"),
            message=f"Physical Artifact Verified! Loaded Knowledge Passport for '{entry.get('title')}'.",
            knowledge_data=knowledge_data,
            scanned_at=now
        )

    # Generic or unsupported tag type
    return RFIDScanOut(
        status="unregistered",
        action="bind_prompt",
        tag_uid=tag_uid,
        tag_type=tag_type,
        label=tag_doc.get("label", "Generic RFID Tag"),
        message=f"RFID Tag '{tag_uid}' recognized. Tap a target to bind or configure this tag.",
        scanned_at=now
    )

async def bind_user_card(
    db: AsyncIOMotorDatabase,
    user_id: str,
    bind_in: RFIDBindUserIn
) -> dict:
    """Pair/bind a physical RFID card UID to an authenticated user's account."""
    tag_uid = normalize_tag_uid(bind_in.tag_uid)
    user_obj_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
    now = datetime.now(timezone.utc)

    user = await db["users"].find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if this tag UID is already bound to a different user
    existing_tag = await db["rfid_tags"].find_one({"tag_uid": tag_uid})
    if existing_tag and str(existing_tag.get("user_id")) != str(user["_id"]) and existing_tag.get("tag_type") == "user_card":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"RFID Card '{tag_uid}' is already linked to another user badge."
        )

    # Upsert tag doc
    tag_doc = {
        "tag_uid": tag_uid,
        "tag_type": "user_card",
        "label": bind_in.label or f"Smart Badge ({user['name']})",
        "user_id": user["_id"],
        "user_name": user["name"],
        "created_by": user["_id"],
        "created_at": existing_tag.get("created_at", now) if existing_tag else now,
        "last_scanned_at": existing_tag.get("last_scanned_at") if existing_tag else None,
        "scan_count": existing_tag.get("scan_count", 0) if existing_tag else 0
    }

    result = await db["rfid_tags"].update_one(
        {"tag_uid": tag_uid},
        {"$set": tag_doc},
        upsert=True
    )

    # Update user record
    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"rfid_card_uid": tag_uid}}
    )

    saved = await db["rfid_tags"].find_one({"tag_uid": tag_uid})
    return saved

async def bind_knowledge_tag(
    db: AsyncIOMotorDatabase,
    user_id: str,
    bind_in: RFIDBindKnowledgeIn
) -> dict:
    """Pair/bind a physical RFID tag UID to a Knowledge Entry / Passport."""
    tag_uid = normalize_tag_uid(bind_in.tag_uid)
    user_obj_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
    entry_id = bind_in.entry_id
    entry_obj_id = ObjectId(entry_id) if ObjectId.is_valid(entry_id) else entry_id
    now = datetime.now(timezone.utc)

    entry = await db["knowledge_entries"].find_one({"_id": entry_obj_id})
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge Entry not found"
        )

    # Upsert tag doc
    tag_doc = {
        "tag_uid": tag_uid,
        "tag_type": "knowledge_passport",
        "label": bind_in.label or f"Artifact: {entry.get('title')}",
        "entry_id": entry["_id"],
        "entry_title": entry.get("title"),
        "created_by": user_obj_id,
        "created_at": now,
        "scan_count": 0
    }

    await db["rfid_tags"].update_one(
        {"tag_uid": tag_uid},
        {"$set": tag_doc},
        upsert=True
    )

    # Update knowledge entry record
    await db["knowledge_entries"].update_one(
        {"_id": entry["_id"]},
        {"$set": {"rfid_tag_uid": tag_uid}}
    )

    saved = await db["rfid_tags"].find_one({"tag_uid": tag_uid})
    return saved

async def list_rfid_tags(
    db: AsyncIOMotorDatabase,
    user_id: Optional[str] = None,
    tag_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> List[dict]:
    """List registered RFID tags with pagination and optional user/type filters."""
    query = {}
    if user_id:
        u_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        query["$or"] = [{"user_id": u_id}, {"created_by": u_id}]
    if tag_type:
        query["tag_type"] = tag_type

    cursor = db["rfid_tags"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    return await cursor.to_list(length=limit)

async def delete_rfid_tag(
    db: AsyncIOMotorDatabase,
    tag_uid: str,
    user_id: Optional[str] = None,
    is_admin: bool = False
) -> bool:
    """Delete / unbind an RFID tag."""
    normalized_uid = normalize_tag_uid(tag_uid)
    tag_doc = await db["rfid_tags"].find_one({"tag_uid": normalized_uid})
    if not tag_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"RFID tag '{tag_uid}' not found"
        )

    if not is_admin and user_id:
        u_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        if tag_doc.get("created_by") != u_id and tag_doc.get("user_id") != u_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this RFID tag"
            )

    # Clear reference on user if any
    if tag_doc.get("user_id"):
        await db["users"].update_one(
            {"_id": tag_doc["user_id"]},
            {"$unset": {"rfid_card_uid": ""}}
        )

    # Clear reference on knowledge entry if any
    if tag_doc.get("entry_id"):
        await db["knowledge_entries"].update_one(
            {"_id": tag_doc["entry_id"]},
            {"$unset": {"rfid_tag_uid": ""}}
        )

    await db["rfid_tags"].delete_one({"tag_uid": normalized_uid})
    return True

async def get_rfid_scan_history(
    db: AsyncIOMotorDatabase,
    limit: int = 50
) -> List[dict]:
    """Retrieve recent RFID scan logs for kiosk diagnostics."""
    cursor = db["rfid_scan_logs"].find({}).sort("timestamp", -1).limit(limit)
    return await cursor.to_list(length=limit)

async def seed_default_rfid_tags(db: AsyncIOMotorDatabase) -> dict:
    """
    Seed realistic starter RFID smart cards and artifact tags
    (Elder Harbhajan, Sita Devi, Admin, Heirloom Seeds, Terracotta, Herbal Kashayam).
    """
    now = datetime.now(timezone.utc)
    seeded_count = 0

    # 1. Seed or find demo users
    harbhajan = await db["users"].find_one({"email": "harbhajan@setu.org"})
    if not harbhajan:
        res = await db["users"].insert_one({
            "name": "Harbhajan Singh",
            "email": "harbhajan@setu.org",
            "hashed_password": get_password_hash("Harbhajan@2026"),
            "role": "contributor",
            "preferred_language": "hi",
            "created_at": now
        })
        harbhajan = await db["users"].find_one({"_id": res.inserted_id})

    sitadevi = await db["users"].find_one({"email": "sitadevi@setu.org"})
    if not sitadevi:
        res = await db["users"].insert_one({
            "name": "Sita Devi",
            "email": "sitadevi@setu.org",
            "hashed_password": get_password_hash("SitaDevi@2026"),
            "role": "contributor",
            "preferred_language": "hi",
            "created_at": now
        })
        sitadevi = await db["users"].find_one({"_id": res.inserted_id})

    admin_user = await db["users"].find_one({"email": "nitesh@gmail.com"})
    if not admin_user:
        res = await db["users"].insert_one({
            "name": "Nitesh Kumar",
            "email": "nitesh@gmail.com",
            "hashed_password": get_password_hash("Admin@2026"),
            "role": "admin",
            "preferred_language": "en",
            "created_at": now
        })
        admin_user = await db["users"].find_one({"_id": res.inserted_id})

    # 2. Seed or find demo knowledge entries
    seed_entry = await db["knowledge_entries"].find_one({"title": {"$regex": "Preserving Ancestral Seed", "$options": "i"}})
    if not seed_entry:
        res = await db["knowledge_entries"].insert_one({
            "title": "Preserving Ancestral Seed Varieties in Drylands",
            "description": "Elder farmer Harbhajan Singh explains how his family has preserved non-hybrid, drought-resistant heirloom seeds across 4 generations in arid soil.",
            "category": "Agriculture",
            "contributor_id": harbhajan["_id"],
            "passport_id": "SETU-PASS-SEED-01",
            "status": "completed",
            "trust_score": 1.0,
            "verification_count": 8,
            "created_at": now,
            "updated_at": now
        })
        seed_entry = await db["knowledge_entries"].find_one({"_id": res.inserted_id})

    pottery_entry = await db["knowledge_entries"].find_one({"title": {"$regex": "Micro-porous Terracotta Firing", "$options": "i"}})
    if not pottery_entry:
        res = await db["knowledge_entries"].insert_one({
            "title": "Micro-porous Terracotta Firing Techniques",
            "description": "Master artisan Sita Devi demonstrates river clay wedging and wood pit kiln baking secrets passed down through centuries.",
            "category": "Traditional Knowledge",
            "contributor_id": sitadevi["_id"],
            "passport_id": "SETU-PASS-POTTERY-02",
            "status": "completed",
            "trust_score": 1.0,
            "verification_count": 6,
            "created_at": now,
            "updated_at": now
        })
        pottery_entry = await db["knowledge_entries"].find_one({"_id": res.inserted_id})
    else:
        await db["knowledge_entries"].update_one(
            {"_id": pottery_entry["_id"]},
            {"$set": {"category": "Traditional Knowledge"}}
        )

    herbal_entry = await db["knowledge_entries"].find_one({"title": {"$regex": "Wild Herbal Kashayam", "$options": "i"}})
    if not herbal_entry:
        res = await db["knowledge_entries"].insert_one({
            "title": "Wild Herbal Kashayam for Respiratory Defense",
            "description": "Ayurvedic expert Dr. Sharma shares the exact brewing ratios for Tulsi, ginger, and licorice decoction for immunity.",
            "category": "Healthcare",
            "contributor_id": harbhajan["_id"],
            "passport_id": "SETU-PASS-HERBAL-03",
            "status": "completed",
            "trust_score": 1.0,
            "verification_count": 12,
            "created_at": now,
            "updated_at": now
        })
        herbal_entry = await db["knowledge_entries"].find_one({"_id": res.inserted_id})
    else:
        await db["knowledge_entries"].update_one(
            {"_id": herbal_entry["_id"]},
            {"$set": {"category": "Healthcare"}}
        )

    # 3. Seed Tag Docs
    sample_tags = [
        {
            "tag_uid": "RFID-SETU-HARBHAJAN",
            "tag_type": "user_card",
            "label": "Harbhajan Singh - Master Farmer Badge",
            "user_id": harbhajan["_id"],
            "user_name": "Harbhajan Singh",
            "created_by": harbhajan["_id"],
            "created_at": now,
            "scan_count": 14
        },
        {
            "tag_uid": "RFID-SETU-SITADEVI",
            "tag_type": "user_card",
            "label": "Sita Devi - Master Artisan Badge",
            "user_id": sitadevi["_id"],
            "user_name": "Sita Devi",
            "created_by": sitadevi["_id"],
            "created_at": now,
            "scan_count": 9
        },
        {
            "tag_uid": "RFID-SETU-ADMIN-01",
            "tag_type": "user_card",
            "label": "Nitesh Kumar - Platform Administrator Badge",
            "user_id": admin_user["_id"],
            "user_name": "Nitesh Kumar",
            "created_by": admin_user["_id"],
            "created_at": now,
            "scan_count": 32
        },
        {
            "tag_uid": "RFID-KNOW-SEED-01",
            "tag_type": "knowledge_passport",
            "label": "Ancestral Heirloom Seed Batch #4 Tag",
            "entry_id": seed_entry["_id"],
            "entry_title": seed_entry["title"],
            "created_by": harbhajan["_id"],
            "created_at": now,
            "scan_count": 27
        },
        {
            "tag_uid": "RFID-KNOW-POTTERY-02",
            "tag_type": "knowledge_passport",
            "label": "Terracotta Kiln Batch Specimen Tag",
            "entry_id": pottery_entry["_id"],
            "entry_title": pottery_entry["title"],
            "created_by": sitadevi["_id"],
            "created_at": now,
            "scan_count": 18
        },
        {
            "tag_uid": "RFID-KNOW-HERBAL-03",
            "tag_type": "knowledge_passport",
            "label": "Wild Tulsi Kashayam Extract Jar Tag",
            "entry_id": herbal_entry["_id"],
            "entry_title": herbal_entry["title"],
            "created_by": harbhajan["_id"],
            "created_at": now,
            "scan_count": 45
        }
    ]

    for tag in sample_tags:
        await db["rfid_tags"].update_one(
            {"tag_uid": tag["tag_uid"]},
            {"$set": tag},
            upsert=True
        )
        seeded_count += 1

    # Also update card uids on users and entries
    await db["users"].update_one({"_id": harbhajan["_id"]}, {"$set": {"rfid_card_uid": "RFID-SETU-HARBHAJAN"}})
    await db["users"].update_one({"_id": sitadevi["_id"]}, {"$set": {"rfid_card_uid": "RFID-SETU-SITADEVI"}})
    await db["users"].update_one({"_id": admin_user["_id"]}, {"$set": {"rfid_card_uid": "RFID-SETU-ADMIN-01"}})
    await db["knowledge_entries"].update_one({"_id": seed_entry["_id"]}, {"$set": {"rfid_tag_uid": "RFID-KNOW-SEED-01"}})
    await db["knowledge_entries"].update_one({"_id": pottery_entry["_id"]}, {"$set": {"rfid_tag_uid": "RFID-KNOW-POTTERY-02"}})
    await db["knowledge_entries"].update_one({"_id": herbal_entry["_id"]}, {"$set": {"rfid_tag_uid": "RFID-KNOW-HERBAL-03"}})

    return {
        "success": True,
        "seeded_count": seeded_count,
        "message": f"Successfully seeded {seeded_count} RFID sample cards and physical artifact tags."
    }
