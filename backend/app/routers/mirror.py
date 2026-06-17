import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Booking, Salon, Transformation
from app.schemas.schemas import TransformationOut
from app.services.auth_service import get_current_user
from app.services.mirror import run_mirror
from app.models.models import User

router = APIRouter(prefix="/mirror", tags=["mirror"])

ALLOWED_SELFIE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SELFIE_SIZE = 10 * 1024 * 1024  # 10 MB

# ── Public: salon profile data ────────────────────────────────────────────────

@router.get("/salon/{salon_id}")
def get_salon_profile(salon_id: int, db: Session = Depends(get_db)):
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    transformations = (
        db.query(Transformation)
        .filter(Transformation.salon_id == salon_id)
        .order_by(Transformation.created_at.desc())
        .all()
    )

    return {
        "id": salon.id,
        "name": salon.name,
        "city": salon.city,
        "neighborhood": salon.neighborhood,
        "description": salon.description,
        "transformations": [
            {
                "id": t.id,
                "artist_name": t.artist_name,
                "service_type": t.service_type,
                "hair_texture_tag": t.hair_texture_tag,
                "before_image_url": t.before_image_url,
                "after_image_url": t.after_image_url,
                "style_description": t.style_description,
                "try_on_count": t.try_on_count,
            }
            for t in transformations
        ],
    }


@router.get("/salons")
def list_salons(db: Session = Depends(get_db)):
    salons = db.query(Salon).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "city": s.city,
            "neighborhood": s.neighborhood,
            "transformation_count": db.query(Transformation)
                .filter(Transformation.salon_id == s.id)
                .count(),
        }
        for s in salons
    ]


# ── Protected: try-on ─────────────────────────────────────────────────────────

@router.post("/try-on")
async def try_on(
    selfie: UploadFile = File(...),
    transformation_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate selfie
    if selfie.content_type not in ALLOWED_SELFIE_TYPES:
        raise HTTPException(status_code=415, detail="Selfie must be JPEG, PNG, or WebP")

    selfie_bytes = await selfie.read()
    if len(selfie_bytes) > MAX_SELFIE_SIZE:
        raise HTTPException(status_code=413, detail="Selfie exceeds 10MB")

    # Fetch transformation
    t = db.query(Transformation).filter(Transformation.id == transformation_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transformation not found")

    style_description = t.style_description
    if not style_description:
        # Fallback: build a generic description from the metadata we have
        style_description = f"{t.hair_texture_tag or 'styled'} hair, {t.service_type} look"

    # Save selfie to a temp file for run_mirror()
    ext = Path(selfie.filename or "selfie.jpg").suffix or ".jpg"
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(selfie_bytes)
        tmp_path = tmp.name

    result_url = run_mirror(tmp_path, style_description)

    # Clean up temp file
    Path(tmp_path).unlink(missing_ok=True)

    if result_url is None:
        raise HTTPException(
            status_code=503,
            detail="Mirror pipeline unavailable — check HF_API_TOKEN or model cold start",
        )

    # Increment counter
    t.try_on_count += 1
    db.commit()

    return {
        "result_url": result_url,
        "transformation_id": transformation_id,
        "style_description": style_description,
        "try_on_count": t.try_on_count,
    }


# ── Protected: book this look ─────────────────────────────────────────────────

@router.post("/book")
def book_look(
    transformation_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = db.query(Transformation).filter(Transformation.id == transformation_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transformation not found")

    booking = Booking(
        customer_id=current_user.id,
        transformation_id=t.id,
        salon_id=t.salon_id,
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return {
        "booking_id": booking.id,
        "salon_id": booking.salon_id,
        "transformation_id": transformation_id,
        "status": booking.status,
    }
