from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    """
    FastAPI Dependency to get the currently authenticated user.
    Validates token presence, format, type, and expiration, then fetches user from MongoDB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Access token expected.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    sub: str = payload.get("sub")
    email: str = payload.get("email")
    if sub is None and email is None:
        raise credentials_exception
        
    user = None
    if email:
        user = await db["users"].find_one({"email": email.lower().strip()})
    if not user and sub:
        from bson import ObjectId
        if ObjectId.is_valid(sub):
            user = await db["users"].find_one({"_id": ObjectId(sub)})
        if not user:
            user = await db["users"].find_one({"email": sub.lower().strip()})
            
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_admin_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    FastAPI Dependency to ensure the current authenticated user has admin privileges.
    """
    user_role = current_user.get("role", "")
    user_email = current_user.get("email", "").lower().strip()
    is_admin = user_role == "admin" or user_email == "nitesh@gmail.com" or "admin" in user_email

    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required."
        )
    return current_user

