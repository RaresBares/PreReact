from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ───────────────────────────────────────────────────────────────
# Basisschema – wird nicht direkt verwendet
# ───────────────────────────────────────────────────────────────

class InventoryBase(BaseModel):
    barcode: str = Field(..., description="EAN/UPC Barcode des Produkts")
    name: Optional[str] = Field(default=None, description="Produktname (optional)")
    quantity: int = Field(default=1, ge=0, description="Anzahl im Lager")
    shelf_id: Optional[int] = Field(default=None, description="Regal-ID, None = kein Regal")
    upper_bound: int = Field(default=0, ge=0, description="Optionaler Maximalwert")
    lower_bound: int = Field(default=0, ge=0, description="Optionaler Minimalwert")
    exp_date: Optional[datetime] = Field(default=None, description="Ablaufdatum")


# ───────────────────────────────────────────────────────────────
# Schema für Rückgabe von Daten (z. B. GET-Routen)
# ───────────────────────────────────────────────────────────────

class InventoryOut(InventoryBase):
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


# ───────────────────────────────────────────────────────────────
# Schema für Erstellung oder manuelles Setzen
# ───────────────────────────────────────────────────────────────

class InventoryCreate(InventoryBase):
    pass


# ───────────────────────────────────────────────────────────────
# Schema für Mengen-Setzen mit Produktanlage-Option
# ───────────────────────────────────────────────────────────────

from app.schemas.product import ProductCreate  # falls nicht schon importiert

class InventorySet(BaseModel):
    barcode: str
    quantity: int = Field(..., ge=0)
    create_product_if_missing: bool = False
    created_product: Optional[ProductCreate] = None


# ───────────────────────────────────────────────────────────────
# Schema für PATCH (Metadaten ändern)
# ───────────────────────────────────────────────────────────────

class InventoryMetaUpdate(BaseModel):
    name: Optional[str] = None
    shelf_id: Optional[int] = None
    exp_date: Optional[datetime] = None
    upper_bound: Optional[int] = Field(default=None, ge=0)
    lower_bound: Optional[int] = Field(default=None, ge=0)

    class Config:
        orm_mode = True
