from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=False)
    first_name = Column(String(128), nullable=False)
    last_name = Column(String(128), nullable=False)
    password_hash = Column(String(256), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    registered_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    verification_token = Column(String(512), nullable=True)
    privilege = Column(Integer, default=0, nullable=False)
    token_version = Column(Integer, default=0, nullable=False)