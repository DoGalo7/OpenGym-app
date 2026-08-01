import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, session_local
from app.routers import exercises, history, profiles, wods
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
    db = session_local()
    try:
        run_seed(db)
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/debug/cors")
def debug_cors():
    """Temporary: shows exactly which origins the running instance parsed from CORS_ORIGINS."""
    return {"cors_origins": cors_origins}


app.include_router(exercises.router, prefix="/api/exercises", tags=["exercises"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(wods.router, prefix="/api/wods", tags=["wods"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
