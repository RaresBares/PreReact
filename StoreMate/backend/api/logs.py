from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import LogStoreSessionLocal
from app.models.inventory_log import InventoryLog

router = APIRouter()

def get_log_db():
    db = LogStoreSessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/last")
def get_last_logs(n: int = 10, db: Session = Depends(get_log_db)):
    return db.query(InventoryLog).order_by(InventoryLog.created_at.desc()).limit(n).all()
