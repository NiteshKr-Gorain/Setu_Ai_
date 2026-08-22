from fastapi import APIRouter, Depends, status, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.core.dependencies import get_current_user
from app.models.user import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Retrieve the current authenticated user's profile information.
    
    Requires a valid JWT access token in the Authorization header.
    """
    return current_user

@router.patch("/me", response_model=UserOut)
async def update_profile(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Update preferred language for the authenticated user.
    """
    user_id = current_user["_id"]
    await db["users"].update_one(
        {"_id": user_id},
        {"$set": {"preferred_language": update_data.preferred_language}}
    )
    
    updated_user = await db["users"].find_one({"_id": user_id})
    return updated_user
