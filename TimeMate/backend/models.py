import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from database import Base
def _uuid():
    return str(uuid.uuid4())
class Restaurant(Base):
    __tablename__ = "restaurants"
    id = Column(String(36), primary_key=True, default=_uuid)
    username = Column(String(128), unique=True, index=True, nullable=False)
    display_name = Column(String(256), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    settings = relationship("RestaurantSettings", back_populates="restaurant", uselist=False, cascade="all,delete-orphan")
class RestaurantSettings(Base):
    __tablename__ = "restaurant_settings"
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), primary_key=True)
    has_map = Column(Boolean, default=False, nullable=False)
    map_svg = Column(Text, nullable=True)
    seats = Column(JSON, nullable=True)
    opening_windows = Column(JSON, nullable=True)
    holidays = Column(JSON, nullable=True)
    extras = Column(JSON, nullable=True)
    min_people = Column(Integer, default=1, nullable=False)
    max_people = Column(Integer, default=10, nullable=False)
    max_concurrency = Column(Integer, default=10, nullable=False)
    default_duration_min = Column(Integer, default=60, nullable=False)
    default_buffer_min = Column(Integer, default=15, nullable=False)
    min_lead_minutes = Column(Integer, default=120, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    restaurant = relationship("Restaurant", back_populates="settings")
class Reservation(Base):
    __tablename__ = "reservations"
    id = Column(String(36), primary_key=True, default=_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), index=True, nullable=False)
    seat_id = Column(String(128), nullable=True, index=True)
    date = Column(DateTime(timezone=True), index=True, nullable=False)
    duration_min = Column(Integer, nullable=False)
    buffer_min = Column(Integer, nullable=False)
    people = Column(Integer, nullable=False)
    extras = Column(JSON, nullable=True)
    first_name = Column(String(128), nullable=False)
    last_name = Column(String(128), nullable=False)
    email = Column(String(256), nullable=False)
    phone = Column(String(64), nullable=True)
    verification_code = Column(String(128), unique=True, nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    confirmed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
