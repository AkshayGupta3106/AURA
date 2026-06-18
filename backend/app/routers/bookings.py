from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import Booking, Transformation, Salon
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _serialize(booking: Booking, transformation: Transformation, salon: Salon) -> dict:
    return {
        "booking_id": booking.id,
        "status": booking.status,
        "booked_at": booking.booked_at.isoformat() if booking.booked_at else None,
        "salon_id": salon.id,
        "salon_name": salon.name,
        "transformation_id": transformation.id,
        "service_type": transformation.service_type,
        "artist_name": transformation.artist_name,
        "after_image_url": transformation.after_image_url,
        "hair_texture_tag": transformation.hair_texture_tag,
    }


@router.get("/me")
def get_my_bookings(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = (
        db.query(Booking, Transformation, Salon)
        .join(Transformation, Booking.transformation_id == Transformation.id)
        .join(Salon, Booking.salon_id == Salon.id)
        .filter(Booking.customer_id == user.id)
        .order_by(Booking.booked_at.desc())
        .all()
    )
    return [_serialize(b, t, s) for b, t, s in rows]


@router.get("/{booking_id}")
def get_booking(booking_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    row = (
        db.query(Booking, Transformation, Salon)
        .join(Transformation, Booking.transformation_id == Transformation.id)
        .join(Salon, Booking.salon_id == Salon.id)
        .filter(Booking.id == booking_id, Booking.customer_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _serialize(*row)
