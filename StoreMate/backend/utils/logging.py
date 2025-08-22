from datetime import datetime
from fastapi.encoders import jsonable_encoder  # WICHTIG
from app.database import LogStoreSessionLocal
from app.models.inventory_log import InventoryLog

def log_action(user_uuid: str, action: str, barcode: str = None, shelf_id: int = None, details: dict = None):
    db = LogStoreSessionLocal()
    log = InventoryLog(
        user_uuid=user_uuid,
        action=action,
        barcode=barcode,
        shelf_id=shelf_id,
        created_at=datetime.utcnow(),
        details=jsonable_encoder(details or {})  # <- hier wird das dict serialisierbar gemacht
    )
    db.add(log)
    db.commit()
    db.close()
