from sqlalchemy import Column, String
from app.database import Base
class Shelf(Base):

    __tablename__ = 'shelves'
    user_uuid = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    id = Column(String, primary_key=True, nullable=False, index=True)