from sqlalchemy import Column, String
from app.database import Base
class Product(Base):
    __tablename__ = "products"
    barcode = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=True)
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
