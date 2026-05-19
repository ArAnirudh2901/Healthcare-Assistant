from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Engine configuration supporting both PostgreSQL and SQLite
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite") and not settings.DATABASE_URL.startswith("sqlite+libsql"):
    connect_args = {"check_same_thread": False, "timeout": 15}
elif not settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"connect_timeout": 10}
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
