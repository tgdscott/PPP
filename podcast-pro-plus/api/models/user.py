from sqlmodel import SQLModel, Field
from pydantic import EmailStr
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional

class UserBase(SQLModel):
    """Base model with shared fields."""
    email: EmailStr = Field(unique=True, index=True)
    is_active: bool = True
    google_id: Optional[str] = Field(default=None, unique=True)

class User(UserBase, table=True):
    """The database model for a User."""
    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(UserBase):
    """Schema for creating a new user (registration)."""
    password: str = Field(..., min_length=8)

class UserPublic(UserBase):
    """Schema for returning user data to the client (omits password)."""
    id: UUID
    created_at: datetime
