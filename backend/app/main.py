from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.database import engine
from app.models import models  # noqa: F401 — registers all models with Base
from app.models.models import Base
from app.routers import auth, virality, salons, bookings, upload, reviews


# Create tables and auto-seed on startup
import os
import sys
from pathlib import Path

# Add backend directory to path if not present so we can import seed
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

db_path = backend_dir / "aura.db"
marker = backend_dir / "db_reset_marker.txt"

# Force re-creation/seeding if salon count is less than 10
from app.database import SessionLocal
from app.models.models import Salon

need_seed = False
if not marker.exists() or not db_path.exists():
    need_seed = True
else:
    try:
        db = SessionLocal()
        count = db.query(Salon).count()
        db.close()
        if count < 10:
            need_seed = True
            if marker.exists():
                try:
                    os.remove(marker)
                except:
                    pass
    except Exception as e:
        print(f"Error checking salon count: {e}")
        need_seed = True

if need_seed:
    if db_path.exists():
        try:
            os.remove(db_path)
            print("Dropped old SQLite database to apply new schema.")
        except Exception as e:
            print(f"Could not drop old database: {e}")
            
    Base.metadata.create_all(bind=engine)
    
    try:
        from seed import seed
        seed()
        print("Successfully auto-seeded database on startup.")
    except Exception as e:
        print(f"Error auto-seeding database: {e}")
        
    try:
        marker.write_text("reset done")
    except Exception as e:
        print(f"Could not write marker file: {e}")
else:
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

# ── Custom Exception Handlers for Validation (Safe from UnicodeDecodeError on bytes) ──
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("app.main")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = []
    for err in exc.errors():
        err_copy = dict(err)
        if "input" in err_copy:
            val = err_copy["input"]
            if isinstance(val, bytes):
                err_copy["input"] = f"<bytes: {len(val)} bytes>"
            elif isinstance(val, dict):
                err_copy["input"] = {
                    k: (f"<bytes: {len(v)} bytes>" if isinstance(v, bytes) else v)
                    for k, v in val.items()
                }
        errors.append(err_copy)
    
    logger.error(f"Request validation failed: {errors}")
    return JSONResponse(
        status_code=422,
        content={"detail": errors}
    )

@app.exception_handler(ResponseValidationError)
async def response_validation_exception_handler(request, exc):
    errors = []
    for err in exc.errors():
        err_copy = dict(err)
        if "input" in err_copy:
            val = err_copy["input"]
            if isinstance(val, bytes):
                err_copy["input"] = f"<bytes: {len(val)} bytes>"
            elif isinstance(val, dict):
                err_copy["input"] = {
                    k: (f"<bytes: {len(v)} bytes>" if isinstance(v, bytes) else v)
                    for k, v in val.items()
                }
        errors.append(err_copy)
    
    logger.error(f"Response validation failed: {errors}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Response validation failed", "errors": errors}
    )

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(virality.router)
app.include_router(salons.router)
app.include_router(bookings.router)
app.include_router(upload.router)
app.include_router(reviews.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "AURA API"}



