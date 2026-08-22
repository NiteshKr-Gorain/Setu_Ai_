from datetime import datetime
from typing import Literal, Annotated, Optional, List
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, field_validator
from bson import ObjectId
from app.models.knowledge_entry import CategoryType

PyObjectId = Annotated[str, BeforeValidator(str)]

def validate_entry_ids(v: Optional[List[str]]) -> Optional[List[str]]:
    if v is None:
        return None
    if len(v) < 1 or len(v) > 200:
        raise ValueError("entry_ids list must contain between 1 and 200 elements.")
    
    seen = []
    for entry_id in v:
        if not ObjectId.is_valid(entry_id):
            raise ValueError(f"Invalid entry ID format: {entry_id}")
        if entry_id not in seen:
            seen.append(entry_id)
    return seen

class LearningPathCreate(BaseModel):
    title: str
    description: str
    category: CategoryType
    entry_ids: List[str]

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Title must be a string.")
        val = v.strip()
        if len(val) < 5 or len(val) > 200:
            raise ValueError("Title must be between 5 and 200 characters.")
        return val

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Description must be a string.")
        val = v.strip()
        if len(val) < 10 or len(val) > 3000:
            raise ValueError("Description must be between 10 and 3000 characters.")
        return val

    @field_validator("entry_ids")
    @classmethod
    def validate_ids(cls, v: List[str]) -> List[str]:
        res = validate_entry_ids(v)
        if res is None:
            raise ValueError("entry_ids list cannot be null.")
        return res

class LearningPathUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[CategoryType] = None
    entry_ids: Optional[List[str]] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not isinstance(v, str):
            raise ValueError("Title must be a string.")
        val = v.strip()
        if len(val) < 5 or len(val) > 200:
            raise ValueError("Title must be between 5 and 200 characters.")
        return val

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not isinstance(v, str):
            raise ValueError("Description must be a string.")
        val = v.strip()
        if len(val) < 10 or len(val) > 3000:
            raise ValueError("Description must be between 10 and 3000 characters.")
        return val

    @field_validator("entry_ids")
    @classmethod
    def validate_ids(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        return validate_entry_ids(v)

class LearningPathOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    title: str
    description: str
    category: CategoryType
    creator_id: PyObjectId
    entry_ids: List[str]
    entry_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )
