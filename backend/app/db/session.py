import os
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Parse and format the database URL to handle libSQL / Turso correctly
db_url = settings.DATABASE_URL

# If scheme is libsql://, convert to sqlite+libsql:// for SQLAlchemy
if db_url.startswith("libsql://"):
    db_url = db_url.replace("libsql://", "sqlite+libsql://", 1)

# For libSQL/Turso databases, make sure authToken is appended if available
if db_url.startswith("sqlite+libsql://"):
    token = os.getenv("TURSO_AUTH_TOKEN") or os.getenv("LIBSQL_AUTH_TOKEN")
    
    parsed = urlparse(db_url)
    query_params = dict(parse_qsl(parsed.query))
    
    # If we have a token, add it to query params if not already present
    if token and "authToken" not in query_params:
        query_params["authToken"] = token
        
    # Enforce secure connection for remote Turso databases
    if "localhost" not in parsed.netloc and "127.0.0.1" not in parsed.netloc:
        if "secure" not in query_params:
            query_params["secure"] = "true"
            
    new_query = urlencode(query_params)
    db_url = urlunparse(parsed._replace(query=new_query))

# Engine configuration supporting both PostgreSQL, SQLite, and libSQL
connect_args = {}
if db_url.startswith("sqlite") and not db_url.startswith("sqlite+libsql"):
    connect_args = {"check_same_thread": False, "timeout": 15}
elif not db_url.startswith("sqlite"):
    connect_args = {"connect_timeout": 10}

engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

