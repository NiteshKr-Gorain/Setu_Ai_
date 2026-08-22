from datetime import datetime, timezone
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.user import UserCreate, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token

async def register_user(db: AsyncIOMotorDatabase, user_in: UserCreate) -> dict:
    """Register a new user in the database."""
    # Normalize email to lowercase
    email = user_in.email.lower()
    
    existing_user = await db["users"].find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_in.password)
    user_dict = {
        "name": user_in.name,
        "email": email,
        "hashed_password": hashed_password,
        "role": user_in.role,
        "preferred_language": user_in.preferred_language,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db["users"].insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    return user_dict

async def authenticate_user(db: AsyncIOMotorDatabase, login_in: UserLogin) -> dict:
    """Authenticate an existing user using email and password."""
    email = login_in.email.lower()
    user = await db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    if not verify_password(login_in.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    return user

async def refresh_access_token(db: AsyncIOMotorDatabase, refresh_token: str) -> str:
    """Exchange a valid refresh token for a new access token."""
    payload = decode_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Refresh token expected.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = await db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return create_access_token(data={"sub": user["email"]})
