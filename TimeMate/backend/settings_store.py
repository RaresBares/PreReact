from sqlalchemy.orm import Session
from fastapi import HTTPException
from models import Restaurant, RestaurantSettings
def ensure_restaurant(db: Session, restaurant_id: str) -> Restaurant:
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail={"code": "restaurant_not_found", "message": "Restaurant id not found"})
    return r
def get_settings(db: Session, restaurant_id: str) -> RestaurantSettings | None:
    return db.query(RestaurantSettings).filter(RestaurantSettings.restaurant_id == restaurant_id).first()
def upsert_settings(db: Session, data: dict) -> RestaurantSettings:
    rid = data["restaurant_id"]
    s = get_settings(db, rid)
    if not s:
        s = RestaurantSettings(restaurant_id=rid)
        db.add(s)
        db.flush()
    s.has_map = bool(data.get("has_map", s.has_map))
    s.map_svg = data.get("map_svg", s.map_svg)
    s.seats = [x.model_dump() if hasattr(x, "model_dump") else x for x in data.get("seats", s.seats or [])]
    s.opening_windows = [x.model_dump() if hasattr(x, "model_dump") else x for x in data.get("opening_windows", s.opening_windows or [])]
    s.holidays = data.get("holidays", s.holidays or [])
    s.extras = data.get("extras", s.extras or [])
    s.min_people = int(data.get("min_people", s.min_people))
    s.max_people = int(data.get("max_people", s.max_people))
    s.max_concurrency = int(data.get("max_concurrency", s.max_concurrency))
    s.default_duration_min = int(data.get("default_duration_min", s.default_duration_min))
    s.default_buffer_min = int(data.get("default_buffer_min", s.default_buffer_min))
    s.min_lead_minutes = int(data.get("min_lead_minutes", s.min_lead_minutes))
    db.commit()
    db.refresh(s)
    return s
