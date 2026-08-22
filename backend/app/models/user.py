from datetime import datetime
from typing import Literal, Annotated, Optional
from pydantic import BaseModel, EmailStr, Field, BeforeValidator, ConfigDict, field_validator

# Custom type to handle MongoDB ObjectId serialization in Pydantic v2
PyObjectId = Annotated[str, BeforeValidator(str)]

def validate_lang_code(v: str) -> str:
    if not isinstance(v, str):
        raise ValueError("Preferred language must be a string.")
    val = v.strip()
    if len(val) != 2 or not val.islower() or not val.isalpha():
        raise ValueError("Preferred language must be a 2-character lowercase ISO code.")
    return val

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["contributor", "learner", "both"]
    preferred_language: str = "en"

    @field_validator("preferred_language")
    @classmethod
    def val_lang(cls, v: str) -> str:
        return validate_lang_code(v)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    name: str
    email: EmailStr
    role: Literal["contributor", "learner", "both"]
    preferred_language: str = "en"
    created_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class UserInDB(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    name: str
    email: EmailStr
    role: Literal["contributor", "learner", "both"]
    hashed_password: str
    preferred_language: str = "en"
    created_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )

class UserUpdate(BaseModel):
    preferred_language: str

    @field_validator("preferred_language")
    @classmethod
    def val_lang(cls, v: str) -> str:
        return validate_lang_code(v)
