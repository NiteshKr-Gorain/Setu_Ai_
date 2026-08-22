from datetime import datetime
from typing import Literal, Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, field_validator
from app.models.knowledge_entry import CategoryType

PyObjectId = Annotated[str, BeforeValidator(str)]

class CommunityCreate(BaseModel):
    name: str
    description: str
    category: CategoryType
    visibility: Literal["public", "private"] = "public"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Name must be a string.")
        val = v.strip()
        if len(val) < 3 or len(val) > 100:
            raise ValueError("Name must be between 3 and 100 characters.")
        return val

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Description must be a string.")
        val = v.strip()
        if len(val) < 20 or len(val) > 3000:
            raise ValueError("Description must be between 20 and 3000 characters.")
        return val

class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[CategoryType] = None
    visibility: Optional[Literal["public", "private"]] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not isinstance(v, str):
            raise ValueError("Name must be a string.")
        val = v.strip()
        if len(val) < 3 or len(val) > 100:
            raise ValueError("Name must be between 3 and 100 characters.")
        return val

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not isinstance(v, str):
            raise ValueError("Description must be a string.")
        val = v.strip()
        if len(val) < 20 or len(val) > 3000:
            raise ValueError("Description must be between 20 and 3000 characters.")
        return val

class CommunityOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    name: str
    description: str
    category: CategoryType
    visibility: Literal["public", "private"]
    admin_id: PyObjectId
    member_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )
