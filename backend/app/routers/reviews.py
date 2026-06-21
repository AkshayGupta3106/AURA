from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.models import Review, Salon, User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewCreate(BaseModel):
    salon_id: int
    rating: int
    text: str


@router.post("")
def create_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can leave reviews",
        )

    salon = db.query(Salon).filter(Salon.id == payload.salon_id).first()
    if not salon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salon not found",
        )

    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5",
        )

    new_review = Review(
        salon_id=payload.salon_id,
        customer_id=current_user.id,
        rating=payload.rating,
        text=payload.text,
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return {
        "id": new_review.id,
        "author": current_user.name,
        "rating": new_review.rating,
        "text": new_review.text,
        "date": "Just now",
        "service": "Hair styling",
        "is_db": True,
    }
