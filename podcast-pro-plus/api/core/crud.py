from sqlmodel import Session, select
from typing import Optional, List
from uuid import UUID
import json

from .security import get_password_hash
from ..models.user import User, UserCreate
from ..models.podcast import PodcastTemplate, PodcastTemplateCreate

# --- User CRUD ---
def get_user_by_email(session: Session, email: str) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()

def create_user(session: Session, user_create: UserCreate) -> User:
    hashed_password = get_password_hash(user_create.password)
    db_user = User.model_validate(
        user_create, 
        update={"hashed_password": hashed_password}
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

# --- Template CRUD ---
def get_template_by_id(session: Session, template_id: UUID) -> Optional[PodcastTemplate]:
    statement = select(PodcastTemplate).where(PodcastTemplate.id == template_id)
    return session.exec(statement).first()

def get_templates_by_user(session: Session, user_id: UUID) -> List[PodcastTemplate]:
    statement = select(PodcastTemplate).where(PodcastTemplate.user_id == user_id)
    return session.exec(statement).all()

def create_user_template(session: Session, template_in: PodcastTemplateCreate, user_id: UUID) -> PodcastTemplate:
    """
    Creates a new template, correctly converting complex objects to JSON strings for storage.
    """
    # Correctly serialize the lists by iterating through them
    segments_json_str = json.dumps([s.model_dump(mode='json') for s in template_in.segments])
    music_rules_json_str = json.dumps([r.model_dump(mode='json') for r in template_in.background_music_rules])
    
    db_template = PodcastTemplate(
        name=template_in.name,
        user_id=user_id,
        segments_json=segments_json_str,
        background_music_rules_json=music_rules_json_str,
        timing_json=template_in.timing.model_dump_json()
    )
    
    session.add(db_template)
    session.commit()
    session.refresh(db_template)
    return db_template