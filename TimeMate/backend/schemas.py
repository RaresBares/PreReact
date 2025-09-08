from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime
class OpeningWindow(BaseModel):
    start: int
    end: int
class HolidaysResponse(BaseModel):
    holidays: List[str]
class QuickCheckRequest(BaseModel):
    restaurant_id: str
    date: datetime
    people: int = 2
class QuickCheckResponse(BaseModel):
    available: bool
class CheckRequest(BaseModel):
    restaurant_id: str
    date: datetime
    people: int
    extras: List[str] = []
    seat_id: Optional[str] = None
class CheckResponse(BaseModel):
    ok: bool
    reason: Optional[str] = None
class ReserveRequest(BaseModel):
    restaurant_id: str
    date: datetime
    people: int
    extras: List[str] = []
    seat_id: Optional[str] = None
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
class ReserveResponse(BaseModel):
    ok: bool
    reservation_id: str
    verification_code: str
    verify_url: str
class VerifyResponse(BaseModel):
    ok: bool
class ConfirmRequest(BaseModel):
    restaurant_id: str
    reservation_id: str
    confirm: bool = True
class ConfirmResponse(BaseModel):
    ok: bool
class DurationResponse(BaseModel):
    estimated_occupancy_min: int
    buffer_min: int
class SeatDef(BaseModel):
    id: str
    label: str
    min_people: int = 1
    max_people: int = 4
class SettingsResponse(BaseModel):
    restaurant_id: str
    has_map: bool
    seats: List[SeatDef] = []
    opening_windows: List[OpeningWindow] = []
    holidays: List[str] = []
    extras: List[str] = []
    min_people: int
    max_people: int
    max_concurrency: int
    default_duration_min: int
    default_buffer_min: int
    min_lead_minutes: int
class RegisterRestaurantRequest(BaseModel):
    id: Optional[str] = None
    username: str
    display_name: str
class UpsertSettingsRequest(BaseModel):
    restaurant_id: str
    has_map: bool = False
    map_svg: Optional[str] = None
    seats: List[SeatDef] = []
    opening_windows: List[OpeningWindow] = []
    holidays: List[str] = []
    extras: List[str] = []
    min_people: int = 1
    max_people: int = 10
    max_concurrency: int = 10
    default_duration_min: int = 60
    default_buffer_min: int = 15
    min_lead_minutes: int = 120
