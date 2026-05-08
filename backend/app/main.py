from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.api.v1.api import api_router
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.api import deps

# Initialize database tables
print("Initializing database tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified successfully.")
except Exception as e:
    print(f"CRITICAL: Database error during startup: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API",
        "status": "online"
    }

@app.get("/health")
def health_check(db: Session = Depends(deps.get_db)):
    try:
        # Try a simple query to verify DB is alive
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# Include routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Debug: Print routes on startup
@app.on_event("startup")
async def list_routes():
    for route in app.routes:
        if hasattr(route, 'path'):
            print(f"DEBUG_ROUTE: {route.path}")
