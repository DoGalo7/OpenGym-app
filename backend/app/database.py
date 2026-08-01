import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

db_path = Path(__file__).resolve().parent.parent / "open_gym.db"
default_sqlite_url = f"sqlite:///{db_path}"

# DATABASE_URL (e.g. a Neon Postgres connection string) overrides the local SQLite default
# used for development. Some providers still hand out the legacy "postgres://" scheme, which
# SQLAlchemy 1.4+/2.0 no longer accepts - normalize it to "postgresql://".
sqlalchemy_database_url = os.environ.get("DATABASE_URL", default_sqlite_url)
if sqlalchemy_database_url.startswith("postgres://"):
    sqlalchemy_database_url = sqlalchemy_database_url.replace("postgres://", "postgresql://", 1)

# check_same_thread only applies to (and is only needed for) SQLite.
connect_args = {"check_same_thread": False} if sqlalchemy_database_url.startswith("sqlite") else {}

engine = create_engine(sqlalchemy_database_url, connect_args=connect_args)
session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = session_local()
    try:
        yield db
    finally:
        db.close()
