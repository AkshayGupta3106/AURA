import os
import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Transformation, Video, Salon
from app.schemas.schemas import TransformationOut, VideoOut
from app.services.auth_service import get_current_user, require_creator
from app.services.style_extractor import extract_style_description
from app.models.models import User
from ..models.models import Booking, Transformation, Salon

router = APIRouter(prefix="/upload", tags=["upload"])

STATIC_DIR = Path("static")
IMAGES_DIR = STATIC_DIR / "images"
VIDEOS_DIR = STATIC_DIR / "videos"

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10 MB
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
    }


def get_creator_salon(creator: User, db: Session) -> Salon:
    salon = db.query(Salon).filter(Salon.owner_id == creator.id).first()
    if not salon:
        raise HTTPException(
            status_code=400,
            detail="No salon found for this creator. Create a salon first."
        )
    return salon


@router.post("/transformation", response_model=TransformationOut, status_code=201)
async def upload_transformation(
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...),
    artist_name: str = Form(...),
    service_type: str = Form(...),
    hair_texture_tag: str = Form(None),
    db: Session = Depends(get_db),
    creator: User = Depends(require_creator),
):
    salon = get_creator_salon(creator, db)

    before_url = save_upload(before_image, IMAGES_DIR, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
    after_url = save_upload(after_image, IMAGES_DIR, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)

    transformation = Transformation(
        salon_id=salon.id,
        artist_name=artist_name,
        service_type=service_type,
        hair_texture_tag=hair_texture_tag,
        before_image_url=before_url,
        after_image_url=after_url,
        style_description=extract_style_description(after_url),  # None if key not set
    )
    db.add(transformation)
    db.commit()
    db.refresh(transformation)
    return transformation


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


# ── Style extraction backfill ──────────────────────────────────────────────────

@router.post("/transformation/{transformation_id}/describe", response_model=TransformationOut)
def describe_transformation(
    transformation_id: int,
    db: Session = Depends(get_db),
    creator: User = Depends(require_creator),
):
    """Re-run Gemini on the after-image. Useful for backfilling Day 1 uploads."""
    t = db.query(Transformation).filter(Transformation.id == transformation_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transformation not found")

    description = extract_style_description(t.after_image_url)
    if description is None:
        raise HTTPException(status_code=503, detail="Style extraction failed — check OPENROUTER_API_KEY")

    t.style_description = description
    db.commit()
    db.refresh(t)
    return t


# ── Salon creation (needed before any upload works) ───────────────────────────

from pydantic import BaseModel

class SalonCreate(BaseModel):
    name: str
    city: str = "Bangalore"
    neighborhood: str = ""
    description: str = ""


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
@router.get("/transformations")
def get_creator_transformations(
    db: Session = Depends(get_db),
    user=Depends(require_creator),
):
    salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
    if not salon:
        return []
    transformations = (
        db.query(Transformation)
        .filter(Transformation.salon_id == salon.id)
        .order_by(Transformation.created_at.desc())
        .all()
    )
    return [
        {
            "id": t.id,
            "artist_name": t.artist_name,
            "service_type": t.service_type,
            "hair_texture_tag": t.hair_texture_tag,
            "before_image_url": t.before_image_url,
            "after_image_url": t.after_image_url,
            "style_description": t.style_description,
            "try_on_count": t.try_on_count,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in transformations
    ]
