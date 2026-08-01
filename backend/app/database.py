from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

db_path = Path(__file__).resolve().parent.parent / "open_gym.db"
sqlalchemy_database_url = f"sqlite:///{db_path}"

engine = create_engine(
    sqlalchemy_database_url,
    connect_args={"check_same_thread": False},
)
session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = session_local()
    try:
        yield db
    finally:
        db.close()
