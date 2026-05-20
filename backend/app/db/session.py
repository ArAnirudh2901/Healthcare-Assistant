import os
from urllib.parse import urlparse, parse_qsl
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Parse and format the database URL to handle libSQL / Turso correctly
db_url = settings.DATABASE_URL

# If scheme is libsql://, convert to sqlite+libsql:// for SQLAlchemy
if db_url.startswith("libsql://"):
    db_url = db_url.replace("libsql://", "sqlite+libsql://", 1)

# Engine configuration supporting both PostgreSQL, SQLite, and libSQL
connect_args = {}

if db_url.startswith("sqlite+libsql://"):
    # Parse URL to extract query parameters
    parsed = urlparse(db_url)
    query_params = dict(parse_qsl(parsed.query))
    
    # Extract token from env variables or URL query params (both camelCase and snake_case)
    token = (
        os.getenv("TURSO_AUTH_TOKEN")
        or os.getenv("LIBSQL_AUTH_TOKEN")
        or query_params.get("authToken")
        or query_params.get("auth_token")
    )
    
    # Pass token in connect_args as expected by the libsql driver
    if token:
        connect_args["auth_token"] = token
        
    # Check if secure connection is required (defaults to True for remote URLs)
    secure_val = query_params.get("secure", "true")
    secure = secure_val.lower() == "true"
    if "localhost" in parsed.netloc or "127.0.0.1" in parsed.netloc:
        secure = False
    
    connect_args["secure"] = secure

elif db_url.startswith("sqlite") and not db_url.startswith("sqlite+libsql"):
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


