from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pathlib import Path
import uuid
from typing import Optional

from app.database import get_db
from app.models.models import Salon, Transformation, User
from app.services.auth_service import require_creator
from pydantic import BaseModel

router = APIRouter(prefix="/upload", tags=["upload"])

STATIC_IMAGES = Path("static/images")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB

def save_image_upload(file: UploadFile, dest_dir: Path, allowed_types: set, max_size: int) -> str:
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail=f"Unsupported image type: {file.content_type}")

    ext = Path(file.filename).suffix or ".jpg"
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
                raise HTTPException(status_code=413, detail="Image file too large")
            out.write(chunk)

    return f"/static/images/{filename}"


class SalonCreate(BaseModel):
    name: str
    city: str = "Bangalore"
    neighborhood: str = ""
    description: str = ""


class SalonUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    neighborhood: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    instagram: Optional[str] = None
    experience_years: Optional[int] = None
    open_for_bookings: Optional[bool] = None


def _salon_dict(salon: Salon, db: Session) -> dict:
    t_count = db.query(Transformation).filter(Transformation.salon_id == salon.id).count()
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
        "transformation_count": t_count,
    }


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
    return _salon_dict(salon, db)


@router.get("/salon/me")
def get_my_salon(
    db: Session = Depends(get_db),
    creator: User = Depends(require_creator),
):
    salon = db.query(Salon).filter(Salon.owner_id == creator.id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    return _salon_dict(salon, db)


@router.patch("/salon/me")
def update_my_salon(
    payload: SalonUpdate,
    db: Session = Depends(get_db),
    creator: User = Depends(require_creator),
):
    salon = db.query(Salon).filter(Salon.owner_id == creator.id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    if payload.name is not None:
        salon.name = payload.name
    if payload.city is not None:
        salon.city = payload.city
    if payload.neighborhood is not None:
        salon.neighborhood = payload.neighborhood
    if payload.description is not None:
        salon.description = payload.description
    if payload.phone is not None:
        salon.phone = payload.phone
    if payload.instagram is not None:
        salon.instagram = payload.instagram
    if payload.experience_years is not None:
        salon.experience_years = payload.experience_years
    if payload.open_for_bookings is not None:
        salon.open_for_bookings = payload.open_for_bookings

    db.commit()
    db.refresh(salon)
    return _salon_dict(salon, db)


@router.post("/transformation", status_code=201)
async def upload_transformation(
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...),
    service_type: str = Form(...),
    artist_name: str = Form(...),
    hair_texture_tag: str = Form(None),
    db: Session = Depends(get_db),
    creator: User = Depends(require_creator),
):
    salon = db.query(Salon).filter(Salon.owner_id == creator.id).first()
    if not salon:
        raise HTTPException(status_code=400, detail="Create a salon before uploading portfolio transformations")

    before_url = save_image_upload(before_image, STATIC_IMAGES, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
    after_url = save_image_upload(after_image, STATIC_IMAGES, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)

    transformation = Transformation(
        salon_id=salon.id,
        artist_name=artist_name,
        service_type=service_type,
        hair_texture_tag=hair_texture_tag.lower() if hair_texture_tag else None,
        before_image_url=before_url,
        after_image_url=after_url,
        style_description=f"{service_type} transformation by {artist_name}",
        try_on_count=0
    )
    db.add(transformation)
    db.commit()
    db.refresh(transformation)

    return {
        "id": transformation.id,
        "salon_id": transformation.salon_id,
        "artist_name": transformation.artist_name,
        "service_type": transformation.service_type,
        "hair_texture_tag": transformation.hair_texture_tag,
        "before_image_url": transformation.before_image_url,
        "after_image_url": transformation.after_image_url,
        "style_description": transformation.style_description,
    }
