from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pathlib import Path
import uuid
import os

from app.database import get_db
from app.models.models import SimulationResult, Video, Salon, User
from app.services.auth_service import require_creator
from app.services.frame_extractor import extract_frames, get_video_duration
from app.services.personas import PERSONAS
from app.services.virality import compute_virality_score, simulate_one_persona
from app.schemas.schemas import VideoOut


router = APIRouter(prefix="/virality", tags=["virality"])


# ── Internal pipeline ─────────────────────────────────────────────────────────

def _run_simulation(video_id: int, db: Session) -> None:
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        return

    video.status = "simulating"
    db.commit()

    try:
        try:
            frame_urls = extract_frames(video.video_url)
        except Exception as e:
            video.status = "pending"
            db.commit()
            raise HTTPException(status_code=500, detail=f"Frame extraction failed: {e}")

        duration_sec = get_video_duration(video.video_url)

        db.query(SimulationResult).filter(SimulationResult.video_id == video_id).delete()
        db.commit()

        raw_results = []
        for persona in PERSONAS:
            result = simulate_one_persona(
                persona=persona,
                frame_urls=frame_urls,
                video_title=video.title,
                duration_sec=duration_sec,
            )
            row = SimulationResult(
                video_id=video_id,
                persona_name=persona["name"],
                persona_profile=persona["full_profile"],
                watch_through=result["watch_through"],
                liked=result["liked"],
                shared=result["shared"],
                skipped_at=result["skipped_at"],
                comment=result["comment"],
            )
            db.add(row)
            raw_results.append(result)

        db.commit()

        score, _ = compute_virality_score(raw_results)
        video.virality_score = score
        video.status = "done"
        db.commit()

    except HTTPException:
        raise
    except Exception:
        video.status = "pending"
        db.commit()
        raise


def _build_persona_response(r) -> dict:
    return {
        "name": r.persona_name,
        "watch_through": r.watch_through,
        "liked": r.liked,
        "shared": r.shared,
        "skipped_at": r.skipped_at,
        "comment": r.comment,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/simulate/{video_id}")
def simulate(
    video_id: int,
    db: Session = Depends(get_db),
    creator: User = Depends(require_creator),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.salon.owner_id != creator.id:
        raise HTTPException(status_code=403, detail="Not your video")
    if video.status == "simulating":
        raise HTTPException(status_code=409, detail="Simulation already running")

    _run_simulation(video_id, db)
    db.refresh(video)

    results = db.query(SimulationResult).filter(SimulationResult.video_id == video_id).all()
    raw = [{"watch_through": r.watch_through, "liked": r.liked, "shared": r.shared, "skipped_at": r.skipped_at} for r in results]
    _, breakdown = compute_virality_score(raw)
    duration_sec = get_video_duration(video.video_url)

    return {
        "video_id": video_id,
        "title": video.title,
        "virality_score": video.virality_score,
        "status": video.status,
        "duration_sec": round(duration_sec, 1),
        "breakdown": breakdown,
        "personas": [_build_persona_response(r) for r in results],
    }


@router.get("/results/{video_id}")
def get_results(
    video_id: int,
    db: Session = Depends(get_db),
    creator: User = Depends(require_creator),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.salon.owner_id != creator.id:
        raise HTTPException(status_code=403, detail="Not your video")

    results = db.query(SimulationResult).filter(SimulationResult.video_id == video_id).all()
    raw = [{"watch_through": r.watch_through, "liked": r.liked, "shared": r.shared, "skipped_at": r.skipped_at} for r in results]
    _, breakdown = compute_virality_score(raw)
    duration_sec = get_video_duration(video.video_url)

    return {
        "video_id": video_id,
        "title": video.title,
        "virality_score": video.virality_score,
        "status": video.status,
        "duration_sec": round(duration_sec, 1),
        "breakdown": breakdown,
        "personas": [_build_persona_response(r) for r in results],
    }


@router.get("/videos")
def list_creator_videos(
    db: Session = Depends(get_db),
    creator: User = Depends(require_creator),
):
    from app.models.models import Salon
    salon = db.query(Salon).filter(Salon.owner_id == creator.id).first()
    if not salon:
        return []
    videos = db.query(Video).filter(Video.salon_id == salon.id).order_by(Video.created_at.desc()).all()
    return [
        {
            "id": v.id,
            "title": v.title,
            "status": v.status,
            "virality_score": v.virality_score,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in videos
    ]


@router.post("/publish/{video_id}")
def publish_video(
    video_id: int,
    db: Session = Depends(get_db),
    creator: User = Depends(require_creator),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.salon.owner_id != creator.id:
        raise HTTPException(status_code=403, detail="Not your video")
    if video.virality_score is None:
        raise HTTPException(status_code=400, detail="Run simulation before publishing")

    video.status = "published"
    db.commit()
    return {"video_id": video_id, "status": "published"}


# ── Video Upload & Salon Setup (Moved from upload.py for Virality Check) ────

STATIC_DIR = Path("static")
VIDEOS_DIR = STATIC_DIR / "videos"
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"}
MAX_VIDEO_SIZE = 200 * 1024 * 1024  # 200 MB

def save_upload(file: UploadFile, dest_dir: Path, allowed_types: set, max_size: int) -> str:
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")

    ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = dest_dir / filename

    dest_dir.mkdir(parents=True, exist_ok=True)

    size = 0
    with open(dest, "wb") as out:
        while chunk := file.file.read(1024 * 64):
            size += len(chunk)
            if size > max_size:
                out.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File too large")
            out.write(chunk)

    return f"/static/{dest_dir.name}/{filename}"

def _salon_dict(salon: Salon) -> dict:
    return {
        "id": salon.id,
        "name": salon.name,
        "city": salon.city,
        "neighborhood": salon.neighborhood,
        "description": salon.description,
        "phone": salon.phone,
        "instagram": salon.instagram,
        "experience_years": salon.experience_years,
        "open_for_bookings": salon.open_for_bookings,
    }

def get_creator_salon(creator: User, db: Session) -> Salon:
    salon = db.query(Salon).filter(Salon.owner_id == creator.id).first()
    if not salon:
        raise HTTPException(
            status_code=400,
            detail="No salon found for this creator. Create a salon first."
        )
    return salon

from pydantic import BaseModel

class SalonCreate(BaseModel):
    name: str
    city: str = "Bangalore"
    neighborhood: str = ""
    description: str = ""

@router.post("/video", response_model=VideoOut, status_code=201)
async def upload_video(
    video: UploadFile = File(...),
    title: str = Form(...),
    db: Session = Depends(get_db),
    creator: User = Depends(require_creator),
):
    salon = get_creator_salon(creator, db)
    video_url = save_upload(video, VIDEOS_DIR, ALLOWED_VIDEO_TYPES, MAX_VIDEO_SIZE)

    video_record = Video(
        salon_id=salon.id,
        creator_id=creator.id,
        video_url=video_url,
        title=title,
        status="pending",
    )
    db.add(video_record)
    db.commit()
    db.refresh(video_record)
    return video_record

@router.post("/salon", status_code=201)
def create_salon(
    payload: SalonCreate,
    db: Session = Depends(get_db),
    creator: User = Depends(require_creator),
):
    existing = db.query(Salon).filter(Salon.owner_id == creator.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Creator already has a salon")

    salon = Salon(
        owner_id=creator.id,
        name=payload.name,
        city=payload.city,
        neighborhood=payload.neighborhood,
        description=payload.description,
    )
    db.add(salon)
    db.commit()
    db.refresh(salon)
    return _salon_dict(salon)

@router.get("/salon/me")
def get_my_salon(
    db: Session = Depends(get_db),
    creator: User = Depends(require_creator),
):
    salon = db.query(Salon).filter(Salon.owner_id == creator.id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    return _salon_dict(salon)

