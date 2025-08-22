from sqlalchemy.orm import Session
from app.models.product import Product

def get_product(db: Session, barcode: str):
    return db.query(Product).filter(Product.barcode == barcode).first()

def create_product(db: Session, barcode: str, name: str | None, image_url: str | None):
    prod = Product(barcode=barcode, name=name, image_url=image_url)
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return prod

