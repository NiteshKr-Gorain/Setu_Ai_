from fastapi import APIRouter, Depends, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.models.user import UserCreate, UserLogin, UserOut
from app.services.auth_service import register_user, authenticate_user, refresh_access_token
from app.core.security import create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Register a new user.
    
    Creates a new user record in MongoDB, hashes their password,
    and returns the UserOut response payload plus initial JWT access and refresh tokens.
    """
    user = await register_user(db, user_in)
    user_out = UserOut.model_validate(user)
    access_token = create_access_token(data={"sub": user["email"]})
    refresh_token = create_refresh_token(data={"sub": user["email"]})
    return {
        "user": user_out,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/login", response_model=dict)
async def login(login_in: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Log in a user.
    
    Verifies the email and password credentials, and if valid,
    returns new JWT access and refresh tokens.
    """
    user = await authenticate_user(db, login_in)
    access_token = create_access_token(data={"sub": user["email"]})
    refresh_token = create_refresh_token(data={"sub": user["email"]})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/token", response_model=dict)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    OAuth2 compatible token login.
    
    Accepts form data (username, password) and returns an access token.
    """
    login_in = UserLogin(email=form_data.username, password=form_data.password)
    user = await authenticate_user(db, login_in)
    access_token = create_access_token(data={"sub": user["email"]})
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=dict)
async def refresh(refresh_token: str = Body(..., embed=True), db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Refresh access token.
    
    Decodes the refresh token, validates it, and generates a fresh JWT access token.
    """
    new_access_token = await refresh_access_token(db, refresh_token)
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }
