from sqlmodel import Session, select
from typing import Optional

from .security import get_password_hash
from ..models.user import User, UserCreate

def get_user_by_email(session: Session, email: str) -> Optional[User]:
    """
    Fetches a single user from the database by their email address.
    """
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()

def create_user(session: Session, user_create: UserCreate) -> User:
    """
    Creates a new user in the database.
    """
    # Hash the password before storing it
    hashed_password = get_password_hash(user_create.password)
    
    # Create the database User object, excluding the plaintext password
    db_user = User.model_validate(
        user_create, 
        update={"hashed_password": hashed_password}
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user
