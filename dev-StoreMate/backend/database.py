from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(settings.DATABASE_URL, future=True)
StoreSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

if settings.LOG_DATABASE_URL:
    log_engine = create_engine(settings.LOG_DATABASE_URL, future=True)
    LogStoreSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=log_engine)
else:
    log_engine = engine
    LogStoreSessionLocal = StoreSessionLocal
LogBase = declarative_base()

def get_db():
    db = StoreSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_log_db():
    db = LogStoreSessionLocal()
    try:
        yield db
    finally:
        db.close()
