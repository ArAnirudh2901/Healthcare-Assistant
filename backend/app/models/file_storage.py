from sqlalchemy import Column, Integer, String, LargeBinary, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base_class import Base

class FileStorage(Base):
    __tablename__ = "file_storage"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    filename = Column(String, index=True, nullable=False)
    file_type = Column(String, index=True, nullable=False) # 'pdf', 'faiss', 'pkl'
    data = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    owner = relationship("User", backref="files")
