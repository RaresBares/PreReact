# import uuid
# from sqlalchemy import Column, String, DateTime, Integer, UUID
# from sqlalchemy.sql import func
# from app.database import Base
# from app.utils.privilege import PrivilegeType, Privilege
#
#
# class User(Base):
#     __tablename__ = "users"
#     uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     email = Column(String, unique=True, index=True, nullable=False)
#     hashed_password = Column(String, nullable=False)
#     age = Column(Integer, nullable=True)
#     username = Column(String, nullable=False)
#     joined = Column(DateTime, nullable=False)
#     fullname = Column(String, nullable=True)
#     profile_image = Column(String, nullable=True)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     privilege = Column(PrivilegeType(), nullable=False, default=Privilege.U)
