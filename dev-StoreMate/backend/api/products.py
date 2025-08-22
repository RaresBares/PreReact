from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud.product import get_product, create_product
from app.schemas.product import ProductCreate, ProductOut

router = APIRouter()

@router.get("/{barcode}", response_model=ProductOut)
def read_product(barcode: str, db: Session = Depends(get_db)):
    prod = get_product(db, barcode)
    if not prod:
        raise HTTPException(404, "Product not found")
    return prod

@router.post("/create", response_model=ProductOut)
def add_product(data: ProductCreate, db: Session = Depends(get_db)):
    if get_product(db, data.barcode):
        raise HTTPException(400, "Already exists")
    return create_product(db, data.barcode, data.name, data.image_url)
