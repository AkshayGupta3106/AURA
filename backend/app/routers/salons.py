from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.models import Salon, Transformation, Video, Review

router = APIRouter(prefix="/salons", tags=["salons"])


def _transformation_dict(t: Transformation) -> dict:
    return {
        "id": t.id,
        "artist_name": t.artist_name,
        "service_type": t.service_type,
        "hair_texture_tag": t.hair_texture_tag,
        "before_image_url": t.before_image_url,
        "after_image_url": t.after_image_url,
        "style_description": t.style_description,
        "try_on_count": t.try_on_count,
    }


def _video_dict(v: Video) -> dict:
    return {
        "id": v.id,
        "title": v.title,
        "video_url": v.video_url,
        "virality_score": v.virality_score,
        "created_at": v.created_at.isoformat() if v.created_at else None,
    }


def _review_dict(r: Review) -> dict:
    return {
        "id": r.id,
        "author": r.customer.name,
        "rating": r.rating,
        "text": r.text,
        "date": r.created_at.strftime("%B %d, %Y") if r.created_at else "Just now",
        "service": "Hair styling",
        "is_db": True,
    }


@router.get("")
def list_salons(
    city: str = Query(None, description="Filter by city (partial match)"),
    service: str = Query(None, description="Filter by service type (partial match)"),
    db: Session = Depends(get_db),
):
    """
    GET /salons
    GET /salons?city=bangalore
    GET /salons?service=balayage
    GET /salons?city=bangalore&service=curly
    """
    query = db.query(Salon)

    if city:
        query = query.filter(Salon.city.ilike(f"%{city}%"))

    if service:
        rows = (
            db.query(Transformation.salon_id)
            .filter(
                or_(
                    Transformation.service_type.ilike(f"%{service}%"),
                    Transformation.hair_texture_tag.ilike(f"%{service}%"),
                )
            )
            .distinct()
            .all()
        )
        id_list = [r[0] for r in rows]
        query = query.filter(Salon.id.in_(id_list))

    salons = query.order_by(Salon.id).all()

    results = []
    for s in salons:
        transformations = db.query(Transformation).filter(Transformation.salon_id == s.id).all()
        published_videos = db.query(Video).filter(
            Video.salon_id == s.id, Video.status == "published"
        ).count()

        service_types = list({t.service_type for t in transformations if t.service_type})

        reviews = db.query(Review).filter(Review.salon_id == s.id).all()
        total_rating = sum(r.rating for r in reviews) + 14
        total_count = len(reviews) + 3
        avg_rating = round(total_rating / total_count, 1)

        results.append({
            "id": s.id,
            "name": s.name,
            "city": s.city,
            "neighborhood": s.neighborhood,
            "description": s.description,
            "service_types": service_types,
            "transformation_count": len(transformations),
            "published_video_count": published_videos,
            "rating": avg_rating,
            "reviews_count": total_count,
        })

    return results


@router.get("/{salon_id}")
def get_salon(salon_id: int, db: Session = Depends(get_db)):
    """
    GET /salons/{salon_id}
    Returns salon detail + all transformations + published videos + unique service tags.
    """
    from fastapi import HTTPException
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    transformations = (
        db.query(Transformation)
        .filter(Transformation.salon_id == salon_id)
        .order_by(Transformation.created_at.desc())
        .all()
    )

    published_videos = (
        db.query(Video)
        .filter(Video.salon_id == salon_id, Video.status == "published")
        .order_by(Video.created_at.desc())
        .all()
    )

    service_types = list({t.service_type for t in transformations if t.service_type})
    texture_tags = list({t.hair_texture_tag for t in transformations if t.hair_texture_tag})

    db_reviews = db.query(Review).filter(Review.salon_id == salon_id).order_by(Review.created_at.desc()).all()
    total_rating = sum(r.rating for r in db_reviews) + 14
    total_count = len(db_reviews) + 3
    avg_rating = round(total_rating / total_count, 1)

    return {
        "id": salon.id,
        "name": salon.name,
        "city": salon.city,
        "neighborhood": salon.neighborhood,
        "description": salon.description,
        "service_types": service_types,
        "texture_tags": texture_tags,
        "transformations": [_transformation_dict(t) for t in transformations],
        "videos": [_video_dict(v) for v in published_videos],
        "reviews": [_review_dict(r) for r in db_reviews],
        "rating": avg_rating,
        "reviews_count": total_count,
    }
