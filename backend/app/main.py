import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, session_local
from app.routers import exercises, history, profiles, wods
from app.seed.seeder import run_seed

app = FastAPI(title="Open Gym-app API")

# Comma-separated list of allowed frontend origins. Defaults to the local Vite dev server;
# override via env var for tunnels/deployments (e.g. a Vercel URL) without touching this file.
cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

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


app.include_router(exercises.router, prefix="/api/exercises", tags=["exercises"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(wods.router, prefix="/api/wods", tags=["wods"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
