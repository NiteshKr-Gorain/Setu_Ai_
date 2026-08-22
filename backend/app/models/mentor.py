from datetime import datetime
from typing import Literal, Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, field_validator
from app.models.knowledge_entry import CategoryType

PyObjectId = Annotated[str, BeforeValidator(str)]

class MentorProfileCreate(BaseModel):
    bio: str
    expertise_categories: list[CategoryType]
    years_of_experience: int
    availability: str
    contact_preference: Literal["platform_message", "email"]

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Bio must be a string.")
        val = v.strip()
        if len(val) < 20 or len(val) > 2000:
            raise ValueError("Bio must be between 20 and 2000 characters.")
        return val

    @field_validator("expertise_categories")
    @classmethod
    def validate_expertise_categories(cls, v: list[CategoryType]) -> list[CategoryType]:
        if not isinstance(v, list):
            raise ValueError("Expertise categories must be a list.")
        seen = []
        for cat in v:
            if cat not in seen:
                seen.append(cat)
        if len(seen) < 1 or len(seen) > 10:
            raise ValueError("Expertise categories must contain between 1 and 10 categories.")
        return seen

    @field_validator("years_of_experience")
    @classmethod
    def validate_experience(cls, v: int) -> int:
        if v < 0 or v > 80:
            raise ValueError("Years of experience must be between 0 and 80.")
        return v

    @field_validator("availability")
    @classmethod
    def validate_availability(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Availability must be a string.")
        val = v.strip()
        if len(val) < 3 or len(val) > 300:
            raise ValueError("Availability must be between 3 and 300 characters.")
        return val

class MentorProfileOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    user_id: PyObjectId
    name: str
    bio: str
    expertise_categories: list[CategoryType]
    years_of_experience: int
    availability: str
    contact_preference: Literal["platform_message", "email"]
    rating_avg: float = 0.0
    rating_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )
