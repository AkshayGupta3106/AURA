from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.database import engine
from app.models import models  # noqa: F401 — registers all models with Base
from app.models.models import Base
from app.routers import auth, upload, mirror, virality, salons

# Create tables on startup
Base.metadata.create_all(bind=engine)

# Ensure static dirs exist
for d in ["static/images", "static/videos", "static/frames"]:
    Path(d).mkdir(parents=True, exist_ok=True)

app = FastAPI(title="AURA API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files ───────────────────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(mirror.router)
app.include_router(virality.router)
app.include_router(salons.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "AURA API"}
