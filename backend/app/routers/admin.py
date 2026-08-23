"""
Admin Governance, Moderation, and Access Control Router for SETU Platform.
Provides:
  - GET /api/admin/overview: Platform-wide summary KPIs, counts, and recent activity
  - GET /api/admin/knowledge: Moderation list with contributor details and filters
  - PUT /api/admin/knowledge/{id}/status: Approve, reject, or update knowledge post status
  - POST /api/admin/knowledge/{id}/fast-verify: Fast-track verify with 100% trust score and passport provenance
  - DELETE /api/admin/knowledge/{id}: Admin takedown of knowledge entry
  - GET /api/admin/users: User list with permission flags and contribution counts
  - PUT /api/admin/users/{id}/permissions: Manage user posting rights, community access, and roles
  - GET /api/admin/communities: Community list with admin governance
  - PUT /api/admin/communities/{id}/feature: Toggle featured community
  - GET /api/admin/ai-usage: (Existing) OpenRouter AI cost control telemetry
"""
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.core.dependencies import get_current_admin_user
from app.models.admin_schemas import (
    AdminOverviewOut,
    AdminKnowledgeItemOut,
    AdminKnowledgeStatusUpdateIn,
    AdminUserItemOut,
    AdminUserPermissionsUpdateIn,
    AdminCommunityItemOut,
    AdminActionResponse
)
from app.services.cost_control_service import get_admin_usage_summary
from app.services import passport_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/overview", response_model=AdminOverviewOut)
async def get_platform_overview(
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Returns platform-wide summary metrics for the Admin Governance Dashboard.
    """
    total_know = await db["knowledge_entries"].count_documents({})
    pending_know = await db["knowledge_entries"].count_documents({
        "status": {"$in": ["draft", "uploaded", "processing", "pending_review"]}
    })
    published_know = await db["knowledge_entries"].count_documents({"status": "completed"})
    rejected_know = await db["knowledge_entries"].count_documents({"status": "rejected"})

    total_users = await db["users"].count_documents({})
    active_contribs = await db["users"].count_documents({"role": {"$in": ["contributor", "both"]}})
    verified_mentors = await db["mentor_profiles"].count_documents({})
    total_communities = await db["communities"].count_documents({})
    total_rfid = await db["rfid_tags"].count_documents({})

    # Fetch recent activity logs from audit trail & RFID scans
    recent_activity = []
    try:
        audit_cursor = db["knowledge_audit_trail"].find({}).sort("created_at", -1).limit(6)
        audit_items = await audit_cursor.to_list(length=6)
        for item in audit_items:
            recent_activity.append({
                "id": str(item["_id"]),
                "type": "audit_event",
                "title": f"Knowledge Event: {item.get('event_type')}",
                "description": item.get("description", "Knowledge entry updated"),
                "actor": item.get("actor_name", "Contributor"),
                "timestamp": item.get("created_at", datetime.now(timezone.utc)).isoformat() if isinstance(item.get("created_at"), datetime) else str(item.get("created_at"))
            })

        rfid_cursor = db["rfid_scan_logs"].find({}).sort("timestamp", -1).limit(4)
        rfid_items = await rfid_cursor.to_list(length=4)
        for item in rfid_items:
            recent_activity.append({
                "id": str(item["_id"]),
                "type": "rfid_tap",
                "title": f"RFID Tap: {item.get('tag_uid')}",
                "description": f"Action: {item.get('action_taken')} ({item.get('status')})",
                "actor": item.get("device_id", "Village Kiosk"),
                "timestamp": item.get("timestamp", datetime.now(timezone.utc)).isoformat() if isinstance(item.get("timestamp"), datetime) else str(item.get("timestamp"))
            })
    except Exception as e:
        logger.warning(f"Error compiling recent activity: {e}")

    # Sort activity by timestamp desc
    recent_activity.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    return AdminOverviewOut(
        total_knowledge_entries=total_know,
        pending_review_entries=pending_know,
        published_entries=published_know,
        rejected_entries=rejected_know,
        total_users=total_users,
        active_contributors=active_contribs,
        verified_mentors=verified_mentors,
        total_communities=total_communities,
        total_rfid_tags=total_rfid,
        recent_activity=recent_activity[:10]
    )

@router.get("/knowledge", response_model=List[AdminKnowledgeItemOut])
async def list_admin_knowledge(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Returns knowledge submissions for moderation with contributor details.
    """
    query: Dict[str, Any] = {}
    if status_filter:
        query["status"] = status_filter
    if category and category != "All":
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]

    cursor = db["knowledge_entries"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    raw_entries = await cursor.to_list(length=limit)

    results = []
    # Collect unique contributor IDs
    contrib_ids = list({e.get("contributor_id") for e in raw_entries if e.get("contributor_id")})
    user_map = {}
    if contrib_ids:
        c_obj_ids = [ObjectId(cid) for cid in contrib_ids if ObjectId.is_valid(cid)]
        users_cursor = db["users"].find({"_id": {"$in": c_obj_ids}})
        users_list = await users_cursor.to_list(length=len(c_obj_ids))
        for u in users_list:
            user_map[str(u["_id"])] = u

    now = datetime.now(timezone.utc)
    for entry in raw_entries:
        cid_str = str(entry.get("contributor_id", ""))
        user_info = user_map.get(cid_str, {})

        results.append(AdminKnowledgeItemOut(
            _id=str(entry["_id"]),
            title=entry.get("title", "Untitled"),
            description=entry.get("description", ""),
            category=entry.get("category", "Traditional Knowledge"),
            status=entry.get("status", "draft"),
            content_type=entry.get("content_type", "text"),
            contributor_id=cid_str,
            contributor_name=user_info.get("name", "Elder Contributor"),
            contributor_email=user_info.get("email", ""),
            passport_id=entry.get("passport_id"),
            trust_score=entry.get("trust_score", 0.0),
            verification_count=entry.get("verification_count", 0),
            created_at=entry.get("created_at", now),
            updated_at=entry.get("updated_at", now),
            moderation_note=entry.get("moderation_note")
        ))

    return results

@router.put("/knowledge/{id}/status", response_model=AdminActionResponse)
async def update_knowledge_moderation_status(
    id: str,
    payload: AdminKnowledgeStatusUpdateIn,
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Admin action: Approve (completed), reject, or modify status of a knowledge post.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid knowledge ID format.")

    obj_id = ObjectId(id)
    entry = await db["knowledge_entries"].find_one({"_id": obj_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Knowledge entry not found.")

    update_fields: Dict[str, Any] = {
        "status": payload.status,
        "updated_at": datetime.now(timezone.utc)
    }
    if payload.moderation_note is not None:
        update_fields["moderation_note"] = payload.moderation_note
    if payload.trust_score is not None:
        update_fields["trust_score"] = payload.trust_score

    await db["knowledge_entries"].update_one(
        {"_id": obj_id},
        {"$set": update_fields}
    )

    # Record Passport audit timeline event
    try:
        admin_id_obj = ObjectId(current_admin["_id"]) if ObjectId.is_valid(current_admin.get("_id")) else ObjectId()
        await passport_service.create_audit_event(
            db=db,
            entry_id=obj_id,
            event_type="VERIFIED" if payload.status == "completed" else "REJECTED" if payload.status == "rejected" else "REVISED",
            actor_id=admin_id_obj,
            actor_name=current_admin.get("name", "Platform Administrator"),
            description=f"Moderation status changed to '{payload.status}'. Note: {payload.moderation_note or 'No notes'}"
        )
    except Exception as e:
        logger.warning(f"Failed to record audit event on status update: {e}")

    action_name = "approved and published" if payload.status == "completed" else payload.status
    return AdminActionResponse(
        success=True,
        message=f"Knowledge entry '{entry.get('title')}' successfully {action_name}.",
        details={"id": id, "status": payload.status}
    )

@router.post("/knowledge/{id}/fast-verify", response_model=AdminActionResponse)
async def fast_track_verify_knowledge(
    id: str,
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Admin Fast-Track Verification: Instantly stamps knowledge entry as 100% verified,
    publishes to Library, and creates passport provenance verification ledger.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid knowledge ID format.")

    obj_id = ObjectId(id)
    entry = await db["knowledge_entries"].find_one({"_id": obj_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Knowledge entry not found.")

    now = datetime.now(timezone.utc)
    passport_id = entry.get("passport_id")
    if not passport_id:
        passport_id = await passport_service.get_unique_passport_id(db)

    await db["knowledge_entries"].update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": "completed",
                "trust_score": 1.0,
                "passport_id": passport_id,
                "moderation_note": "Fast-Track Verified by Setu Platform Administrator",
                "updated_at": now
            },
            "$inc": {"verification_count": 1}
        }
    )

    # Write audit log to Knowledge Passport timeline
    try:
        admin_id_obj = ObjectId(current_admin["_id"]) if ObjectId.is_valid(current_admin.get("_id")) else ObjectId()
        await passport_service.create_audit_event(
            db=db,
            entry_id=obj_id,
            event_type="VERIFIED",
            actor_id=admin_id_obj,
            actor_name=f"Admin: {current_admin.get('name', 'Platform Administrator')}",
            description=f"Direct Admin Fast-Track Verification Seal stamped with Passport ID: {passport_id}.",
            metadata={"trust_score": 1.0, "verified_at": now.isoformat()}
        )
    except Exception as e:
        logger.warning(f"Failed to record fast-verify audit event: {e}")

    return AdminActionResponse(
        success=True,
        message=f"Knowledge entry '{entry.get('title')}' is now 100% Verified and published to Library with Passport ID: {passport_id}.",
        details={"id": id, "passport_id": passport_id, "trust_score": 1.0}
    )

@router.delete("/knowledge/{id}", response_model=AdminActionResponse)
async def delete_knowledge_by_admin(
    id: str,
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Admin action: Permanently take down / delete a knowledge entry and associated tags.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid knowledge ID format.")

    obj_id = ObjectId(id)
    entry = await db["knowledge_entries"].find_one({"_id": obj_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Knowledge entry not found.")

    await db["knowledge_entries"].delete_one({"_id": obj_id})
    await db["knowledge_versions"].delete_many({"entry_id": obj_id})
    await db["knowledge_verifications"].delete_many({"entry_id": obj_id})
    await db["rfid_tags"].delete_many({"entry_id": obj_id})

    return AdminActionResponse(
        success=True,
        message=f"Knowledge entry '{entry.get('title')}' removed from platform.",
        details={"id": id}
    )

@router.get("/users", response_model=List[AdminUserItemOut])
async def list_admin_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    List users with permission states (can_post, can_create_community, is_active, RFID tags).
    """
    query: Dict[str, Any] = {}
    if role and role != "All":
        query["role"] = role
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]

    cursor = db["users"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    users_list = await cursor.to_list(length=limit)

    results = []
    now = datetime.now(timezone.utc)
    for u in users_list:
        uid_obj = u["_id"]
        know_count = await db["knowledge_entries"].count_documents({"contributor_id": uid_obj})
        
        # Check if mentor profile exists
        mentor_doc = await db["mentor_profiles"].find_one({"user_id": str(uid_obj)})

        results.append(AdminUserItemOut(
            _id=str(uid_obj),
            name=u.get("name", "Unnamed"),
            email=u.get("email", ""),
            role=u.get("role", "contributor"),
            preferred_language=u.get("preferred_language", "en"),
            can_post=u.get("can_post", True),
            can_create_community=u.get("can_create_community", True),
            is_active=u.get("is_active", True),
            is_verified_mentor=bool(mentor_doc),
            rfid_card_uid=u.get("rfid_card_uid"),
            knowledge_count=know_count,
            created_at=u.get("created_at", now)
        ))

    return results

@router.put("/users/{id}/permissions", response_model=AdminActionResponse)
async def update_user_permissions(
    id: str,
    payload: AdminUserPermissionsUpdateIn,
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Admin Action: Toggle user posting rights (can_post), community creation, active status, or change role.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid user ID format.")

    obj_id = ObjectId(id)
    user = await db["users"].find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    update_fields: Dict[str, Any] = {}
    if payload.role is not None:
        update_fields["role"] = payload.role
    if payload.can_post is not None:
        update_fields["can_post"] = payload.can_post
    if payload.can_create_community is not None:
        update_fields["can_create_community"] = payload.can_create_community
    if payload.is_active is not None:
        update_fields["is_active"] = payload.is_active
    if payload.preferred_language is not None:
        update_fields["preferred_language"] = payload.preferred_language

    if update_fields:
        await db["users"].update_one(
            {"_id": obj_id},
            {"$set": update_fields}
        )

    return AdminActionResponse(
        success=True,
        message=f"Permissions for user '{user.get('name')}' updated successfully.",
        details={"user_id": id, "updated_fields": list(update_fields.keys())}
    )

@router.get("/communities", response_model=List[AdminCommunityItemOut])
async def list_admin_communities(
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Admin view of all community hubs with creator names and member counts.
    """
    cursor = db["communities"].find({}).sort("created_at", -1).limit(50)
    comms = await cursor.to_list(length=50)

    results = []
    now = datetime.now(timezone.utc)
    for c in comms:
        admin_id_str = str(c.get("admin_id", ""))
        admin_name = "Community Creator"
        if ObjectId.is_valid(admin_id_str):
            a_user = await db["users"].find_one({"_id": ObjectId(admin_id_str)})
            if a_user:
                admin_name = a_user.get("name", "Community Creator")

        members = c.get("members", [])
        members_count = len(members) if isinstance(members, list) else 1

        results.append(AdminCommunityItemOut(
            _id=str(c["_id"]),
            name=c.get("name", "Untitled Community"),
            description=c.get("description", ""),
            category=c.get("category", "General"),
            visibility=c.get("visibility", "public"),
            admin_id=admin_id_str,
            admin_name=admin_name,
            members_count=members_count,
            is_featured=c.get("is_featured", False),
            created_at=c.get("created_at", now)
        ))

    return results

@router.put("/communities/{id}/feature", response_model=AdminActionResponse)
async def toggle_feature_community(
    id: str,
    featured: bool = Query(True),
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Admin Action: Toggle featured badge on community hub.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid community ID format.")

    obj_id = ObjectId(id)
    comm = await db["communities"].find_one({"_id": obj_id})
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found.")

    await db["communities"].update_one(
        {"_id": obj_id},
        {"$set": {"is_featured": featured}}
    )

    state_str = "featured" if featured else "unfeatured"
    return AdminActionResponse(
        success=True,
        message=f"Community '{comm.get('name')}' marked as {state_str}.",
        details={"community_id": id, "is_featured": featured}
    )

@router.get("/ai-usage")
async def get_ai_usage_statistics(
    month: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    (System Health Sub-Tab): OpenRouter AI cost tracking, budget guard, and query cache telemetry.
    """
    summary = await get_admin_usage_summary(db=db, month=month)
    return summary
