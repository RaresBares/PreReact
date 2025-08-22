from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.auth import get_current_user  # <- Auth-Dependency

router = APIRouter()

class NotificationOut(BaseModel):
    id: int
    title: str
    description: str
    date: datetime  # wird automatisch ISO-8601 serialisiert

# Dummy-Daten (normalerweise aus DB, nach user.id gefiltert)
_dummy: List[NotificationOut] = [
    NotificationOut(
        id=1,
        title="Lagerbestand niedrig",
        description="Artikel 12345 hat nur noch 2 Stück im Lager.",
        date=datetime(2025, 8, 15, 10, 0, tzinfo=timezone.utc),
    ),
    NotificationOut(
        id=2,
        title="Neuer Scan",
        description="Artikel 67890 wurde soeben gescannt.",
        date=datetime(2025, 8, 15, 11, 30, tzinfo=timezone.utc),
    ),
    NotificationOut(
        id=3,
        title="Ablaufdatum erreicht",
        description="Artikel 54321 ist heute abgelaufen.",
        date=datetime(2025, 8, 14, 23, 59, tzinfo=timezone.utc),
    ),
    NotificationOut(
        id=4,
        title="Neues Produkt hinzugefügt",
        description="Artikel 98765 wurde zum Inventar hinzugefügt.",
        date=datetime(2025, 8, 13, 15, 20, tzinfo=timezone.utc),
    ),
]

@router.get("/", response_model=List[NotificationOut])
def get_notifications(user=Depends(get_current_user)):
    # TODO (später): aus DB laden -> WHERE user_id = user.id ORDER BY date DESC
    return _dummy