# app/models/inventory_log.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import LogBase

class InventoryLog(LogBase):
    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True)
    user_uuid = Column(String, nullable=False)
    action = Column(String, nullable=False)
    barcode = Column(String, nullable=True)
    shelf_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
