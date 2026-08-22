from datetime import datetime
from typing import Literal, Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, field_validator

PyObjectId = Annotated[str, BeforeValidator(str)]

class MentorRequestCreate(BaseModel):
    message: str

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Message must be a string.")
        val = v.strip()
        if len(val) < 10 or len(val) > 1500:
            raise ValueError("Message must be between 10 and 1500 characters.")
        return val

class MentorRequestOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    learner_id: PyObjectId
    learner_name: str
    mentor_id: PyObjectId
    mentor_name: str
    message: str
    status: Literal["pending", "accepted", "declined"]
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )
