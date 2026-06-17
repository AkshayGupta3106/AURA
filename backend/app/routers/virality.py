from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import SimulationResult, Video
from app.services.auth_service import require_creator
from app.services.frame_extractor import extract_frames, get_video_duration
from app.services.personas import PERSONAS
from app.services.virality import compute_virality_score, simulate_one_persona
from app.models.models import User

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
