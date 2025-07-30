from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID, uuid4

class User(BaseModel):
    id: UUID = Field(default_factory=uuid4, description="Unique identifier for the user")
    email: str = Field(..., description="User's email address, used for login")
    hashed_password: str = Field(..., description="Hashed password for the user")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of user creation")

class UserInDB(User):
    pass
