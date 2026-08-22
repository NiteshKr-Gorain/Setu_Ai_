"""
Admin Router for SETU Backend.
Provides administrative endpoints including AI cost-control usage telemetry and budget status.
"""
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.core.dependencies import get_current_admin_user
from app.services.cost_control_service import get_admin_usage_summary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/ai-usage")
async def get_ai_usage_statistics(
    month: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Admin-Only Endpoint: Returns comprehensive OpenRouter AI cost tracking,
    budget utilization (against ₹1500 monthly limit), model request counts,
    and cache-hit vs. AI-call telemetry rates.
    """
    summary = await get_admin_usage_summary(db=db, month=month)
    return summary
