import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, ensure_column, session_local
from app.routers import admin_exercises, exercises, favorites, history, profiles, shared_wods, wods
from app.seed.seeder import run_seed

app = FastAPI(title="Open Gym-app API")

# Comma-separated list of allowed frontend origins. Defaults to the local Vite dev server;
# override via env var for tunnels/deployments (e.g. a Vercel URL) without touching this file.
# Stripped/filtered so stray whitespace (e.g. "a, b" or a trailing newline from pasting the
# value into a dashboard) doesn't silently break the exact-match CORS check.
cors_origins = [
    origin.strip() for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    ensure_column("exercises", "base_movement", "VARCHAR(50)")
    ensure_column("exercises", "equipment_tag", "VARCHAR(30)")
    ensure_column("exercises", "warmup_only", "BOOLEAN NOT NULL DEFAULT FALSE")
    ensure_column("wod_history", "note", "TEXT")
    ensure_column("wod_history", "favorite", "BOOLEAN NOT NULL DEFAULT FALSE")
    ensure_column("injuries", "condition_key", "VARCHAR(50)")
    ensure_column("user_profiles", "password_hash", "VARCHAR(160)")
    ensure_column("predefined_wods", "is_buddy", "BOOLEAN NOT NULL DEFAULT FALSE")
    ensure_column("wod_history", "rating", "INTEGER")
    ensure_column("user_profiles", "recovery_code_hash", "VARCHAR(160)")
    ensure_column("exercises", "pending_review", "BOOLEAN NOT NULL DEFAULT FALSE")
    db = session_local()
    try:
        run_seed(db)
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(exercises.router, prefix="/api/exercises", tags=["exercises"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(wods.router, prefix="/api/wods", tags=["wods"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(favorites.router, prefix="/api/favorites", tags=["favorites"])
app.include_router(shared_wods.router, prefix="/api/shared-wods", tags=["shared-wods"])
app.include_router(admin_exercises.router, prefix="/api/admin/exercises", tags=["admin"])
