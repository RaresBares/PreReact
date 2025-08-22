# from datetime import datetime
#
# from sqlalchemy.orm import Session
# from app.models.user import User
# from app.utils.hash import get_password_hash
# import uuid
#
# def create_user(db: Session, email: str, username: str, password: str):
#     user = User(
#         uuid=str(uuid.uuid4()),
#         email=email,
#         username=username,
#         joined=datetime.now(),
#         hashed_password=get_password_hash(password)
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)
#     return user
#
# def get_user_by_email(db: Session, email: str):
#     return db.query(User).filter(User.email == email).first()
#
# def get_user_by_uuid(db: Session, user_id: str):
#     return db.query(User).filter(User.uuid == user_id).first()
