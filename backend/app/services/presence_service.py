"""
Live User State & Presence Service for SETU.
Features:
  1. Tunable heartbeat and staleness thresholds (20s heartbeat, 45s idle, 90s stale).
  2. MongoDB collection `user_state` with backend-confirmed UTC timestamps.
  3. Staleness resolution function `resolve_state()` with human-readable freshness strings.
  4. Real-time WebSocket pub/sub ConnectionManager for instant presence broadcasting.
"""
import logging
from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import WebSocket

logger = logging.getLogger(__name__)

# =========================================================================
# LIVE USER STATE & STALENESS CONFIGURATION (TUNABLE CONSTANTS)
# =========================================================================
HEARTBEAT_INTERVAL_SECONDS: int = 20        # Recommended client heartbeat frequency (15–30s)
IDLE_THRESHOLD_SECONDS: int = 45            # No heartbeat for > 45s transitions active -> idle
STALE_THRESHOLD_SECONDS: int = 90           # No heartbeat for > 90s overrides status -> offline

def compute_freshness_string(seconds_elapsed: float) -> str:
    """Computes a friendly human-readable freshness string."""
    if seconds_elapsed < 10:
        return "just now"
    if seconds_elapsed < 60:
        return f"{int(seconds_elapsed)} seconds ago"
    minutes = int(seconds_elapsed // 60)
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    hours = int(seconds_elapsed // 3600)
    if hours < 24:
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    days = int(seconds_elapsed // 86400)
    return f"{days} day{'s' if days > 1 else ''} ago"

def resolve_state(
    user_doc: Optional[Dict[str, Any]],
    now: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Computes resolved presence state with staleness detection.
    If now() - last_confirmed_at > STALE_THRESHOLD_SECONDS (90s):
      - Overrides status to 'offline' (even if stored status was 'active').
      - Sets is_stale = True.
    """
    current_time = now or datetime.now(timezone.utc)

    if not user_doc:
        return {
            "user_id": "unknown",
            "status": "offline",
            "raw_status": None,
            "current_activity": None,
            "current_resource": None,
            "session_id": None,
            "last_confirmed_at": None,
            "freshness": "Never active",
            "is_stale": True,
            "seconds_since_confirmed": None
        }

    user_id = str(user_doc.get("user_id", user_doc.get("_id", "unknown")))
    raw_status = user_doc.get("status", "offline")
    last_confirmed = user_doc.get("last_confirmed_at")

    if not last_confirmed:
        return {
            "user_id": user_id,
            "status": "offline",
            "raw_status": raw_status,
            "current_activity": user_doc.get("current_activity"),
            "current_resource": user_doc.get("current_resource"),
            "session_id": user_doc.get("session_id"),
            "last_confirmed_at": None,
            "freshness": "Never active",
            "is_stale": True,
            "seconds_since_confirmed": None
        }

    # Ensure timezone awareness
    if isinstance(last_confirmed, datetime):
        if last_confirmed.tzinfo is None:
            last_confirmed = last_confirmed.replace(tzinfo=timezone.utc)
    elif isinstance(last_confirmed, str):
        try:
            last_confirmed = datetime.fromisoformat(last_confirmed.replace("Z", "+00:00"))
        except Exception:
            last_confirmed = current_time

    delta_seconds = max(0.0, (current_time - last_confirmed).total_seconds())
    iso_confirmed = last_confirmed.isoformat()

    # Staleness Evaluation
    if raw_status == "offline":
        resolved_status = "offline"
        is_stale = False
    elif delta_seconds > STALE_THRESHOLD_SECONDS:
        # Exceeded 90s -> override status to offline
        resolved_status = "offline"
        is_stale = True
    elif delta_seconds > IDLE_THRESHOLD_SECONDS and raw_status == "active":
        # Exceeded 45s without activity -> resolve to idle
        resolved_status = "idle"
        is_stale = False
    else:
        resolved_status = raw_status
        is_stale = False

    return {
        "user_id": user_id,
        "status": resolved_status,
        "raw_status": raw_status,
        "current_activity": user_doc.get("current_activity"),
        "current_resource": user_doc.get("current_resource"),
        "session_id": user_doc.get("session_id"),
        "last_confirmed_at": iso_confirmed,
        "freshness": compute_freshness_string(delta_seconds),
        "is_stale": is_stale,
        "seconds_since_confirmed": round(delta_seconds, 1)
    }

class PresenceConnectionManager:
    """
    WebSocket Connection Manager for Real-Time Presence Streaming.
    Manages client subscriptions to specific users or global presence feeds.
    """
    def __init__(self):
        # user_id -> Set of WebSockets listening to this user
        self._user_subscribers: Dict[str, Set[WebSocket]] = {}
        # Set of WebSockets listening to all presence updates
        self._feed_subscribers: Set[WebSocket] = set()

    async def connect_user_stream(self, user_id: str, websocket: WebSocket):
        """Subscribes a websocket client to presence updates for a specific user."""
        await websocket.accept()
        if user_id not in self._user_subscribers:
            self._user_subscribers[user_id] = set()
        self._user_subscribers[user_id].add(websocket)
        logger.info(f"WebSocket client subscribed to presence for user '{user_id}'.")

    def disconnect_user_stream(self, user_id: str, websocket: WebSocket):
        """Removes a websocket client from user subscriptions."""
        if user_id in self._user_subscribers:
            self._user_subscribers[user_id].discard(websocket)
            if not self._user_subscribers[user_id]:
                del self._user_subscribers[user_id]
        logger.info(f"WebSocket client disconnected from presence for user '{user_id}'.")

    async def connect_feed_stream(self, websocket: WebSocket):
        """Subscribes a websocket client to the global presence feed."""
        await websocket.accept()
        self._feed_subscribers.add(websocket)
        logger.info("WebSocket client subscribed to global presence feed.")

    def disconnect_feed_stream(self, websocket: WebSocket):
        """Removes a websocket client from the global presence feed."""
        self._feed_subscribers.discard(websocket)
        logger.info("WebSocket client disconnected from global presence feed.")

    async def broadcast_state_change(self, user_id: str, state_dict: Dict[str, Any]):
        """Pushes resolved state updates to all subscribed clients in real time."""
        payload = {
            "type": "presence_update",
            "user_id": user_id,
            "state": state_dict,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        # 1. Notify user-specific subscribers
        if user_id in self._user_subscribers:
            dead_sockets = []
            for ws in list(self._user_subscribers[user_id]):
                try:
                    await ws.send_json(payload)
                except Exception:
                    dead_sockets.append(ws)
            for ws in dead_sockets:
                self._user_subscribers[user_id].discard(ws)

        # 2. Notify global feed subscribers
        dead_feed_sockets = []
        for ws in list(self._feed_subscribers):
            try:
                await ws.send_json(payload)
            except Exception:
                dead_feed_sockets.append(ws)
        for ws in dead_feed_sockets:
            self._feed_subscribers.discard(ws)

# Global singleton presence manager instance
presence_manager = PresenceConnectionManager()

async def record_heartbeat(
    db: AsyncIOMotorDatabase,
    user_id: str,
    status: Optional[str] = "active",
    current_activity: Optional[str] = None,
    current_resource: Optional[str] = None,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Updates the user's presence record in MongoDB 'user_state', sets last_confirmed_at to now(UTC),
    computes the resolved state, and broadcasts to real-time WebSocket subscribers.
    """
    now = datetime.now(timezone.utc)
    clean_user_id = str(user_id)

    update_fields: Dict[str, Any] = {
        "status": status or "active",
        "last_confirmed_at": now,
        "updated_at": now
    }

    if current_activity is not None:
        update_fields["current_activity"] = current_activity
    if current_resource is not None:
        update_fields["current_resource"] = current_resource
    if session_id is not None:
        update_fields["session_id"] = session_id

    # Upsert in MongoDB
    await db["user_state"].update_one(
        {"user_id": clean_user_id},
        {
            "$set": update_fields,
            "$setOnInsert": {
                "created_at": now
            }
        },
        upsert=True
    )

    # Fetch updated doc and resolve state
    updated_doc = await db["user_state"].find_one({"user_id": clean_user_id})
    resolved = resolve_state(updated_doc, now=now)

    # Real-time WebSocket push
    await presence_manager.broadcast_state_change(clean_user_id, resolved)

    return resolved

async def get_resolved_user_state(
    db: AsyncIOMotorDatabase,
    user_id: str
) -> Dict[str, Any]:
    """Fetches user presence document from MongoDB and returns its resolved state."""
    clean_user_id = str(user_id)
    doc = await db["user_state"].find_one({"user_id": clean_user_id})
    return resolve_state(doc)

async def get_active_users(
    db: AsyncIOMotorDatabase,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Returns all users whose last_confirmed_at was within the last STALE_THRESHOLD_SECONDS (90s)
    and whose resolved status is 'active' or 'idle'.
    """
    now = datetime.now(timezone.utc)
    cursor = db["user_state"].find().sort("last_confirmed_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)

    active_list = []
    for doc in docs:
        res = resolve_state(doc, now=now)
        if res["status"] in ["active", "idle"]:
            active_list.append(res)

    return active_list
