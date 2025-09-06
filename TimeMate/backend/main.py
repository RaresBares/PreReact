from datetime import datetime
from fastapi import FastAPI,Depends,HTTPException,Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .db import SessionLocal,engine,Base
from . import models,schemas,crud,utils
app=FastAPI(title="TimeMate Backend")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        crud.ensure_seats_seed(db)
@app.get("/health")
def health():
    return {"ok":True}
@app.get("/config/opening", response_model=schemas.OpeningResponse)
def get_opening():
    year=datetime.utcnow().year
    return {"opening": crud.OPENING, "holidays": crud.holiday_ranges(year)}
@app.get("/seats")
def seats(db:Session=Depends(get_db)):
    rows=db.execute(models.Seat.__table__.select().order_by(models.Seat.label)).all()
    return [{"label":r.label,"active":r.active} for r in rows]
@app.get("/availability/quick", response_model=schemas.QuickCheckResponse)
def availability_quick(date:str=Query(...),time:str=Query(...),people:int=Query(2),db:Session=Depends(get_db)):
    start_dt= utils.parse_datetime(date, time)
    if not crud.is_within_opening(start_dt):
        return {"ok":False,"free":0,"total": crud.total_active_seats(db)}
    d,buf= crud.duration_policy(people, start_dt)
    end_dt= utils.combine_start_end(start_dt, d, buf)
    total= crud.total_active_seats(db)
    used= crud.count_reserved_seats(db, start_dt, end_dt)
    free=max(0,total-used)
    return {"ok":free>0,"free":free,"total":total}
@app.post("/availability/check", response_model=schemas.CheckResponse)
def availability_check(payload: schemas.CheckRequest, people:int=Query(2), db:Session=Depends(get_db)):
    start_dt= utils.parse_datetime(payload.date, payload.time)
    if not crud.is_within_opening(start_dt):
        return {"ok":False}
    d,buf= crud.duration_policy(people, start_dt)
    end_dt= utils.combine_start_end(start_dt, d, buf)
    ok= crud.is_seat_free(db, payload.seat_label, start_dt, end_dt)
    return {"ok":ok}
@app.get("/policy/duration", response_model=schemas.DurationResponse)
def policy_duration(date:str=Query(...),time:str=Query(...),people:int=Query(2)):
    start_dt= utils.parse_datetime(date, time)
    d,buf= crud.duration_policy(people, start_dt)
    end_dt= utils.combine_start_end(start_dt, d, buf)
    return {"duration_minutes":d,"buffer_minutes":buf,"starts_at":start_dt,"ends_at":end_dt}
@app.post("/reservations", response_model=schemas.ReserveResponse)
def create_reservation(payload: schemas.ReserveRequest, db:Session=Depends(get_db)):
    start_dt= utils.parse_datetime(payload.date, payload.time)
    if not crud.is_within_opening(start_dt):
        raise HTTPException(status_code=400,detail="closed")
    d,buf= crud.duration_policy(payload.people, start_dt)
    end_dt= utils.combine_start_end(start_dt, d, buf)
    if not crud.is_seat_free(db, payload.seat_label, start_dt, end_dt):
        raise HTTPException(status_code=409,detail="seat_taken")
    code= crud.new_verification_code()
    r= models.Reservation(first_name=payload.first_name, last_name=payload.last_name, email=str(payload.email), phone=payload.phone, people=payload.people, seat_label=payload.seat_label, extras=payload.extras, starts_at=start_dt, ends_at=end_dt, buffer_minutes=buf, verified=False, confirmed=False, verification_code=code)
    db.add(r)
    db.commit()
    verify_url="http://localhost:8000/verify?code="+code
    return {"success":True,"id":str(r.id),"verify_url":verify_url}
@app.get("/reservations/verify", response_model=schemas.VerifyResponse)
def verify_reservation(code:str=Query(...),db:Session=Depends(get_db)):
    r=db.query(models.Reservation).filter(models.Reservation.verification_code == code).first()
    if not r:
        raise HTTPException(status_code=404,detail="not_found")
    if not r.verified:
        r.verified=True
        db.commit()
    return {"success":True}
@app.get("/verify", response_model=schemas.VerifyResponse)
def verify_short(code:str=Query(...),db:Session=Depends(get_db)):
    r=db.query(models.Reservation).filter(models.Reservation.verification_code == code).first()
    if not r:
        raise HTTPException(status_code=404,detail="not_found")
    if not r.verified:
        r.verified=True
        db.commit()
    return {"success":True}
@app.post("/reservations/{reservation_id}/confirm", response_model=schemas.ConfirmResponse)
def confirm_reservation(reservation_id:str,db:Session=Depends(get_db)):
    r=db.query(models.Reservation).filter(models.Reservation.id == reservation_id).first()
    if not r:
        raise HTTPException(status_code=404,detail="not_found")
    r.confirmed=True
    db.commit()
    return {"success":True}
