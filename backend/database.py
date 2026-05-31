from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"), pool_pre_ping=True)

Base = declarative_base()

SessionLocal = sessionmaker(bind=engine)

# ==========================================
# API İSTEKLERİ İÇİN EKLENEN OTURUM YÖNETİCİSİ
# ==========================================
def get_db():
    """
    Her API isteğinde yeni bir veritabanı oturumu açar
    ve işlem bitince (hata olsa bile) güvenlice kapatır.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()