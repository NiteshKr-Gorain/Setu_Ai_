from datetime import datetime
from typing import Literal, Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, field_validator

PyObjectId = Annotated[str, BeforeValidator(str)]

class VerificationCreate(BaseModel):
    trust_level: Literal["verified", "needs_review", "disputed"]
    comment: Optional[str] = None

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not isinstance(v, str):
            raise ValueError("Comment must be a string.")
        val = v.strip()
        if not val:
            return None
        if len(val) < 5 or len(val) > 2000:
            raise ValueError("Comment must be between 5 and 2000 characters if provided.")
        return val

class VerificationOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    entry_id: PyObjectId
    reviewer_id: PyObjectId
    reviewer_name: str
    trust_level: Literal["verified", "needs_review", "disputed"]
    comment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )
