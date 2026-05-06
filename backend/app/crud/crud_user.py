from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

def get_by_email(db: Session, *, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get(db: Session, id: int) -> Optional[User]:
    return db.query(User).filter(User.id == id).first()

def create(db: Session, *, obj_in: UserCreate) -> User:
    db_obj = User(
        email=obj_in.email,
        hashed_password=get_password_hash(obj_in.password),
        full_name=obj_in.full_name,
        is_superuser=obj_in.is_superuser,
        is_active=obj_in.is_active,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
