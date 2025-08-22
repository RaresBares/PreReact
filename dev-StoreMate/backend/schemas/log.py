from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class LogEntryOut(BaseModel):
    id: int
    user_uuid: str
    action: str
    barcode: Optional[str] = None
    shelf_id: Optional[int] = None
    details: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True
