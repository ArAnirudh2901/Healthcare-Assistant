import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print("DATABASE_URL:", DATABASE_URL)

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.db.base import Base

    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("SUCCESS! Tables created/verified.")
except Exception as e:
    import traceback
    traceback.print_exc()
