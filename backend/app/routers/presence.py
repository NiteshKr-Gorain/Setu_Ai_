"""
FastAPI Router for Live User State & Real-Time Presence Streaming.
Provides:
  - POST /api/state/heartbeat (authenticated periodic heartbeat)
  - GET /api/state/{user_id} (resolved presence with staleness calculation)
  - GET /api/state/active/list (list of active/idle users)
  - WebSocket /api/state/ws/user/{user_id} (real-time stream for user state)
  - WebSocket /api/state/ws/feed (real-time global presence feed)
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.core.dependencies import get_current_user
from app.models.presence import HeartbeatIn, UserStateOut, HeartbeatResponse, ActiveUsersResponse
from app.services.presence_service import (
    record_heartbeat,
    get_resolved_user_state,
    get_active_users,
    presence_manager,
    resolve_state
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/state", tags=["presence"])

@router.post("/heartbeat", response_model=HeartbeatResponse)
async def send_heartbeat(
    payload: HeartbeatIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Authenticated Heartbeat Endpoint.
    Updates the user's last_confirmed_at timestamp in MongoDB to UTC now,
    optionally records current activity/resource, and broadcasts the resolved state.
    """
    user_id = str(current_user.get("_id") or current_user.get("id") or current_user.get("email"))
    
    resolved = await record_heartbeat(
        db=db,
        user_id=user_id,
        status=payload.status,
        current_activity=payload.current_activity,
        current_resource=payload.current_resource,
        session_id=payload.session_id
    )

    return HeartbeatResponse(
        success=True,
        resolved_state=UserStateOut(**resolved)
    )

@router.get("/active/list", response_model=ActiveUsersResponse)
async def list_active_users(
    limit: int = 50,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Returns all currently active or idle users on the platform."""
    active_users = await get_active_users(db, limit=limit)
    return ActiveUsersResponse(
        total_active_count=len(active_users),
        active_users=[UserStateOut(**u) for u in active_users]
    )

@router.get("/{user_id}", response_model=UserStateOut)
async def get_user_presence(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Returns resolved live user presence state with staleness detection:
    status (active/idle/offline), activity, resource, last confirmed timestamp,
    and human-readable freshness string.
    """
    resolved = await get_resolved_user_state(db, user_id=user_id)
    return UserStateOut(**resolved)

@router.websocket("/ws/user/{user_id}")
async def websocket_user_presence(
    websocket: WebSocket,
    user_id: str
):
    """
    Real-Time WebSocket Stream for a specific user's presence state.
    Pushes instant updates whenever the user sends a heartbeat or changes activity.
    """
    await presence_manager.connect_user_stream(user_id, websocket)
    try:
        while True:
            # Keep socket alive and accept client ping/pongs
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        presence_manager.disconnect_user_stream(user_id, websocket)
    except Exception as e:
        logger.warning(f"WebSocket error for user '{user_id}': {e}")
        presence_manager.disconnect_user_stream(user_id, websocket)

@router.websocket("/ws/feed")
async def websocket_global_presence_feed(
    websocket: WebSocket
):
    """
    Real-Time WebSocket Stream for the global platform presence feed.
    Pushes live events whenever any user status or activity changes.
    """
    await presence_manager.connect_feed_stream(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        presence_manager.disconnect_feed_stream(websocket)
    except Exception as e:
        logger.warning(f"WebSocket feed error: {e}")
        presence_manager.disconnect_feed_stream(websocket)
