from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models here so that Base.metadata has them
from app.models.user import User
