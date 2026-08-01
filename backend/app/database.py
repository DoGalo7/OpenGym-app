import os
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
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


def ensure_column(table: str, column: str, ddl_type: str) -> None:
    """Adds a column to an already-existing table if it's missing, for the rare small schema
    change that `Base.metadata.create_all()` can't handle (it only creates missing tables, never
    alters existing ones). There's no migrations framework in this project - this is a deliberately
    minimal stand-in, safe to call on every startup since it's a no-op once the column exists."""
    inspector = inspect(engine)
    if table not in inspector.get_table_names():
        return  # table doesn't exist yet - create_all() will create it with the column already
    existing_columns = {c["name"] for c in inspector.get_columns(table)}
    if column in existing_columns:
        return
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))
