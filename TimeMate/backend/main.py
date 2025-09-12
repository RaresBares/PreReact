from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import uuid
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, get_db
from models import Restaurant, RestaurantSettings, Reservation
from schemas import OpeningWindow, HolidaysResponse, QuickCheckRequest, QuickCheckResponse, CheckRequest, CheckResponse, ReserveRequest, ReserveResponse, VerifyResponse, ConfirmRequest, ConfirmResponse, DurationResponse, SettingsResponse, RegisterRestaurantRequest, UpsertSettingsRequest, SeatDef
from settings_store import ensure_restaurant, get_settings, upsert_settings
from emailer import send_verification_email
app = FastAPI(title="Reservations Service")

# deine bestehende app mit allen Routen

# NACHDEM alle Routen definiert sind:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # oder ["*"] wenn du willst
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=False,                   # keine Cookies → ok mit "*"
    max_age=86400
)

@app.on_event("startup")
def _init():
    Base.metadata.create_all(bind=engine)
def ok(data):
    return {"success": True, "payload": data}
def fail(code: str, message: str, status: int = 400):
    raise HTTPException(status_code=status, detail={"code": code, "message": message})
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"code": "error", "message": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content={"success": False, "payload": detail})
def _tz(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
def compute_duration(people: int) -> tuple[int, int]:
    est = 60 + max(0, people - 2) * 15
    buf = 15 + (5 if people >= 6 else 0)
    return est, buf
def overlaps(start_a: datetime, dur_a: int, start_b: datetime, dur_b: int) -> bool:
    end_a = start_a + timedelta(minutes=dur_a)
    end_b = start_b + timedelta(minutes=dur_b)
    return start_a < end_b and start_b < end_a
def overlapping_reservations(db: Session, restaurant_id: str, when: datetime, total: int, seat_id: str | None = None):
    q = db.query(Reservation).filter(Reservation.restaurant_id == restaurant_id)
    low = when - timedelta(hours=8)
    high = when + timedelta(hours=8)
    q = q.filter(Reservation.date >= low, Reservation.date <= high)
    if seat_id is not None:
        q = q.filter(Reservation.seat_id == seat_id)
    res = []
    for r in q.all():
        if overlaps(r.date, r.duration_min + r.buffer_min, when, total):
            res.append(r)
    return res
def minutes_since_midnight(dt: datetime) -> int:
    local = dt.astimezone(timezone.utc)
    return local.hour * 60 + local.minute
def is_open_at(settings: RestaurantSettings, when: datetime) -> bool:
    t = minutes_since_midnight(when)
    wins = settings.opening_windows or []
    for w in wins:
        s = int(w.get("start", 0))
        e = int(w.get("end", 0))
        if s <= t < e:
            return True
    return False
def is_holiday_on(settings: RestaurantSettings, when: datetime) -> bool:
    d = when.date().isoformat()
    holidays = settings.holidays or []
    return d in holidays
def enforce_lead_time(settings: RestaurantSettings, when: datetime):
    now = datetime.now(timezone.utc)
    delta = when - now
    min_lead = timedelta(minutes=int(settings.min_lead_minutes or 0))
    if delta < min_lead:
        earliest = now + min_lead
        fail("lead_time_violation", f"earliest allowed start is {earliest.isoformat()} UTC", 422)
def capacity_available(db: Session, settings: RestaurantSettings, when: datetime, people: int) -> bool:
    dur, buf = compute_duration(people)
    total = dur + buf
    if settings.has_map and settings.seats:
        taken = {r.seat_id for r in overlapping_reservations(db, settings.restaurant_id, when, total) if r.seat_id}
        seats = [s for s in settings.seats or [] if people >= int(s.get("min_people", 1)) and people <= int(s.get("max_people", 4))]
        free = [s for s in seats if s.get("id") not in taken]
        return len(free) > 0
    else:
        cnt = len(overlapping_reservations(db, settings.restaurant_id, when, total))
        return cnt < int(settings.max_concurrency or 0)
def seat_is_free(db: Session, settings: RestaurantSettings, when: datetime, people: int, seat_id: str) -> bool:
    dur, buf = compute_duration(people)
    total = dur + buf
    taken = overlapping_reservations(db, settings.restaurant_id, when, total, seat_id=seat_id)
    return len(taken) == 0
@app.get("/health")
def health():
    return ok({"ok": True})
@app.post("/restaurants/register")
def register_restaurant(payload: RegisterRestaurantRequest, db: Session = Depends(get_db)):
    if payload.id:
        exists = db.query(Restaurant).filter(Restaurant.id == payload.id).first()
        if exists:
            return ok({"id": exists.id, "username": exists.username, "display_name": exists.display_name})
    u = db.query(Restaurant).filter(Restaurant.username == payload.username).first()
    if u:
        fail("username_exists", "username already exists", 409)
    r = Restaurant(id=payload.id or str(uuid.uuid4()), username=payload.username, display_name=payload.display_name)
    db.add(r)
    db.commit()
    db.refresh(r)
    s = db.query(RestaurantSettings).filter(RestaurantSettings.restaurant_id == r.id).first()
    if not s:
        s = RestaurantSettings(restaurant_id=r.id, has_map=False, seats=[], opening_windows=[{"start": 480, "end": 720}, {"start": 780, "end": 1080}], holidays=[], extras=[], min_people=1, max_people=10, max_concurrency=10, default_duration_min=60, default_buffer_min=15, min_lead_minutes=120)
        db.add(s)
        db.commit()
    return ok({"id": r.id, "username": r.username, "display_name": r.display_name})


@app.post("/restaurants/settings/upsert")
def upsert_restaurant_settings(payload: UpsertSettingsRequest, db: Session = Depends(get_db)):
    ensure_restaurant(db, payload.restaurant_id)
    s = upsert_settings(db, payload.model_dump())
    seats = [SeatDef(**x) for x in (s.seats or [])]
    windows = [OpeningWindow(**x) for x in (s.opening_windows or [])]
    return ok(SettingsResponse(restaurant_id=s.restaurant_id, has_map=s.has_map, seats=seats, opening_windows=windows, holidays=s.holidays or [], extras=s.extras or [], min_people=s.min_people, max_people=s.max_people, max_concurrency=s.max_concurrency, default_duration_min=s.default_duration_min, default_buffer_min=s.default_buffer_min, min_lead_minutes=s.min_lead_minutes).model_dump())
@app.get("/settings/{restaurant_id}")
def get_settings_api(restaurant_id: str, db: Session = Depends(get_db)):
    ensure_restaurant(db, restaurant_id)
    s = get_settings(db, restaurant_id)
    if not s:
        fail("settings_not_found", "settings not found", 404)
    seats = [SeatDef(**x) for x in (s.seats or [])]
    windows = [OpeningWindow(**x) for x in (s.opening_windows or [])]
    return ok(SettingsResponse(restaurant_id=s.restaurant_id, has_map=s.has_map, seats=seats, opening_windows=windows, holidays=s.holidays or [], extras=s.extras or [], min_people=s.min_people, max_people=s.max_people, max_concurrency=s.max_concurrency, default_duration_min=s.default_duration_min, default_buffer_min=s.default_buffer_min, min_lead_minutes=s.min_lead_minutes).model_dump())
@app.get("/map_svg/{restaurant_id}", response_class=PlainTextResponse)
def map_svg(restaurant_id: str, db: Session = Depends(get_db)):
    ensure_restaurant(db, restaurant_id)
    s = get_settings(db, restaurant_id)
    if not s or not s.map_svg:
        raise HTTPException(status_code=407, detail={"code": "svg_not_found", "message": "no svg for restaurant"})
    return PlainTextResponse(content=s.map_svg, media_type="image/svg+xml")
@app.get("/seats/{restaurant_id}")
def get_seats(restaurant_id: str, db: Session = Depends(get_db)):
    ensure_restaurant(db, restaurant_id)
    s = get_settings(db, restaurant_id)
    seats = [SeatDef(**x).model_dump() for x in (s.seats or [])]
    return ok({"seats": seats})
@app.get("/opening/{restaurant_id}")
def opening(restaurant_id: str, db: Session = Depends(get_db)):
    ensure_restaurant(db, restaurant_id)
    s = get_settings(db, restaurant_id)
    wins = s.opening_windows or [{"start": 480, "end": 720}, {"start": 780, "end": 1080}]
    return ok({"windows": [OpeningWindow(**x).model_dump() for x in wins]})
@app.get("/holidays/{restaurant_id}")
def holidays(restaurant_id: str, db: Session = Depends(get_db)):
    ensure_restaurant(db, restaurant_id)
    s = get_settings(db, restaurant_id)
    return ok(HolidaysResponse(holidays=s.holidays or []).model_dump())
@app.get("/has_free_seats")
def has_free_seats(restaurant_id: str, date: str, people: int = 2, db: Session = Depends(get_db)):
    ensure_restaurant(db, restaurant_id)
    s = get_settings(db, restaurant_id)
    try:
        when = _tz(datetime.fromisoformat(date))
    except Exception:
        fail("invalid_datetime", "invalid date format, use ISO8601", 422)
    if is_holiday_on(s, when):
        fail("holiday", "closed on holiday", 409)
    if not is_open_at(s, when):
        fail("closed", "outside opening hours", 409)
    enforce_lead_time(s, when)
    return ok({"available": capacity_available(db, s, when, people)})
@app.post("/quickcheck")
def quickcheck(payload: QuickCheckRequest, db: Session = Depends(get_db)):
    ensure_restaurant(db, payload.restaurant_id)
    s = get_settings(db, payload.restaurant_id)
    when = _tz(payload.date)
    if is_holiday_on(s, when):
        fail("holiday", "closed on holiday", 409)
    if not is_open_at(s, when):
        fail("closed", "outside opening hours", 409)
    enforce_lead_time(s, when)
    return ok(QuickCheckResponse(available=capacity_available(db, s, when, payload.people)).model_dump())
@app.post("/check")
def check(payload: CheckRequest, db: Session = Depends(get_db)):
    ensure_restaurant(db, payload.restaurant_id)
    s = get_settings(db, payload.restaurant_id)
    when = _tz(payload.date)
    if is_holiday_on(s, when):
        fail("holiday", "closed on holiday", 409)
    if not is_open_at(s, when):
        fail("closed", "outside opening hours", 409)
    enforce_lead_time(s, when)
    if payload.seat_id:
        ok_flag = seat_is_free(db, s, when, payload.people, payload.seat_id)
        return ok(CheckResponse(ok=ok_flag, reason=None if ok_flag else "occupied").model_dump())
    ok_flag = capacity_available(db, s, when, payload.people)
    return ok(CheckResponse(ok=ok_flag, reason=None if ok_flag else "capacity_reached").model_dump())
@app.post("/reserve")
def reserve(payload: ReserveRequest, db: Session = Depends(get_db)):
    ensure_restaurant(db, payload.restaurant_id)
    s = get_settings(db, payload.restaurant_id)
    when = _tz(payload.date)
    if is_holiday_on(s, when):
        fail("holiday", "closed on holiday", 409)
    if not is_open_at(s, when):
        fail("closed", "outside opening hours", 409)
    enforce_lead_time(s, when)
    dur, buf = compute_duration(payload.people)
    total = dur + buf
    if payload.seat_id:
        if not seat_is_free(db, s, when, payload.people, payload.seat_id):
            fail("occupied", "seat is occupied", 409)
    else:
        if not capacity_available(db, s, when, payload.people):
            fail("capacity_reached", "no capacity available", 409)
    code = uuid.uuid4().hex + uuid.uuid4().hex[:8]
    r = Reservation(restaurant_id=payload.restaurant_id, seat_id=payload.seat_id, date=when, duration_min=dur, buffer_min=buf, people=payload.people, extras=payload.extras, first_name=payload.first_name, last_name=payload.last_name, email=str(payload.email), phone=payload.phone or "", verification_code=code, verified=False, confirmed=False)
    db.add(r)
    db.commit()
    db.refresh(r)
    verify_url = f"/verify?code={code}"
    try:
        send_verification_email(str(payload.email), verify_url)
    except Exception:
        pass
    return ok(ReserveResponse(ok=True, reservation_id=r.id, verification_code=code, verify_url=verify_url).model_dump())
@app.get("/verify")
def verify(code: str, db: Session = Depends(get_db)):
    r = db.query(Reservation).filter(Reservation.verification_code == code).first()
    if not r:
        fail("invalid_code", "verification code invalid", 400)
    r.verified = True
    db.commit()
    return ok(VerifyResponse(ok=True).model_dump())
@app.post("/confirm")
def confirm(payload: ConfirmRequest, db: Session = Depends(get_db)):
    ensure_restaurant(db, payload.restaurant_id)
    r = db.query(Reservation).filter(Reservation.id == payload.reservation_id, Reservation.restaurant_id == payload.restaurant_id).first()
    if not r:
        fail("not_found", "reservation not found", 404)
    r.confirmed = bool(payload.confirm)
    db.commit()
    return ok(ConfirmResponse(ok=True).model_dump())
@app.get("/duration")
def duration(restaurant_id: str, people: int = 2, db: Session = Depends(get_db)):
    ensure_restaurant(db, restaurant_id)
    dur, buf = compute_duration(people)
    return ok(DurationResponse(estimated_occupancy_min=dur, buffer_min=buf).model_dump())

def _norm(s: Optional[str]) -> str:
    return (s or "").strip().casefold()

def seat_name_exists(db: Session, restaurant_id: str, name: str, exclude_seat_id: Optional[str] = None) -> bool:
    s = get_settings(db, restaurant_id)
    n = _norm(name)
    for x in (s.seats or []):
        if exclude_seat_id and x.get("id") == exclude_seat_id:
            continue
        if _norm(x.get("label") or x.get("name")) == n:
            return True
    return False




@app.get("/exists/{restaurant_id}")
def exists_seat_name(restaurant_id: str, db: Session = Depends(get_db)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        return ok({"exists": False})
    return ok({"exists": True})

