"""
seed.py — Run from backend/ directory:  python seed.py

Creates:
  - 1 creator account   → creator@aura.demo / demo1234
  - 1 customer account  → customer@aura.demo / demo1234
  - 1 salon (Studio Kesh, Koramangala)
  - 4 transformations with pre-written style_descriptions
  - 1 video with pre-saved simulation results (virality = 78.4)
  - 1 pre-confirmed booking

Downloads hair reference images into /static/images/.
Sets up a mirror fallback image at /static/images/mirror_fallback.jpg.
No OpenRouter or HuggingFace calls needed.
"""

import os
import sys
import requests
from datetime import datetime

# Ensure backend/app is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bcrypt
from app.database import engine, SessionLocal
from app.models.models import Base, User, Salon, Transformation, Video, SimulationResult, Booking

# ─── Ensure static dirs exist ────────────────────────────────────────────────
STATIC_IMAGES = os.path.join(os.path.dirname(__file__), "static", "images")
STATIC_VIDEOS = os.path.join(os.path.dirname(__file__), "static", "videos")
STATIC_FRAMES = os.path.join(os.path.dirname(__file__), "static", "frames")
for d in [STATIC_IMAGES, STATIC_VIDEOS, STATIC_FRAMES]:
    os.makedirs(d, exist_ok=True)

Base.metadata.create_all(bind=engine)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def download_image(url: str, filename: str) -> str:
    """Download image to /static/images/, return the /static/... URL path."""
    dest = os.path.join(STATIC_IMAGES, filename)
    if os.path.exists(dest):
        return f"/static/images/{filename}"
    try:
        r = requests.get(url, timeout=12)
        if r.status_code == 200:
            with open(dest, "wb") as f:
                f.write(r.content)
            print(f"  ↓ {filename}")
        else:
            print(f"  ✗ {filename} (HTTP {r.status_code}) — using URL directly")
    except Exception as e:
        print(f"  ✗ {filename} ({e}) — using URL directly")
    return f"/static/images/{filename}"


# ─── Transformation data ─────────────────────────────────────────────────────
# Using picsum with fixed seeds for deterministic placeholder images.
# SWAP these with actual hair photos before demo for maximum impact.

TRANSFORMATIONS = [
    {
        "filename_before": "t1_before.jpg",
        "filename_after":  "t1_after.jpg",
        "before_url":  "https://picsum.photos/seed/hair_b1/400/500",
        "after_url":   "https://picsum.photos/seed/hair_a1/400/500",
        "artist_name": "Deepika R",
        "service_type": "Balayage",
        "hair_texture_tag": "straight",
        "style_description": (
            "Warm honey-blonde balayage on straight, shoulder-length hair with subtle caramel "
            "highlights that blend seamlessly from mid-shaft to tips. High shine, silky texture "
            "with a natural sun-kissed finish."
        ),
        "try_on_count": 24,
    },
    {
        "filename_before": "t2_before.jpg",
        "filename_after":  "t2_after.jpg",
        "before_url":  "https://picsum.photos/seed/hair_b2/400/500",
        "after_url":   "https://picsum.photos/seed/hair_a2/400/500",
        "artist_name": "Meena K",
        "service_type": "Curly Transformation",
        "hair_texture_tag": "wavy",
        "style_description": (
            "Voluminous, defined curls with a deep side part on medium-length hair. Rich dark "
            "brown with soft, bouncy spirals from root to tip. Zero frizz, maximum definition."
        ),
        "try_on_count": 11,
    },
    {
        "filename_before": "t3_before.jpg",
        "filename_after":  "t3_after.jpg",
        "before_url":  "https://picsum.photos/seed/hair_b3/400/500",
        "after_url":   "https://picsum.photos/seed/hair_a3/400/500",
        "artist_name": "Deepika R",
        "service_type": "Korean Glass Hair",
        "hair_texture_tag": "straight",
        "style_description": (
            "Pin-straight, ultra-glossy black hair falling to collar-bone length with a centre "
            "part. Mirror-like shine with an ethereal smooth finish — no flyaways, no texture."
        ),
        "try_on_count": 38,
    },
    {
        "filename_before": "t4_before.jpg",
        "filename_after":  "t4_after.jpg",
        "before_url":  "https://picsum.photos/seed/hair_b4/400/500",
        "after_url":   "https://picsum.photos/seed/hair_a4/400/500",
        "artist_name": "Ritu S",
        "service_type": "Short Bob",
        "hair_texture_tag": "curly",
        "style_description": (
            "Chic jaw-length bob on natural curly hair with a slight inward curl at the ends. "
            "Rich espresso brown with a mahogany undertone. Full body from root with lightweight, "
            "airy curl definition."
        ),
        "try_on_count": 7,
    },
]

# Pre-saved persona simulation results — no API call needed on demo day
PERSONA_RESULTS = [
    {
        "persona_name": "Priya",
        "persona_profile": "24yo working professional, Koramangala, price-aware",
        "watch_through": 72,
        "liked": True,
        "shared": False,
        "skipped_at": None,
        "comment": "Love the transformation but show the price in the first 3 seconds.",
    },
    {
        "persona_name": "Ananya",
        "persona_profile": "31yo new mom, Whitefield, trusts recommendations",
        "watch_through": 91,
        "liked": True,
        "shared": True,
        "skipped_at": None,
        "comment": "Sending this to my sister RIGHT NOW. This is exactly what she wants done.",
    },
    {
        "persona_name": "Riya",
        "persona_profile": "19yo college student, Indiranagar, low attention span",
        "watch_through": 55,
        "liked": True,
        "shared": True,
        "skipped_at": 11,
        "comment": "omg love the volume!! where is this salon?? dropping pin rn",
    },
    {
        "persona_name": "Meera",
        "persona_profile": "28yo beauty enthusiast, HSR Layout, saves everything",
        "watch_through": 100,
        "liked": True,
        "shared": False,
        "skipped_at": None,
        "comment": (
            "Technique looks clean. The colour theory is on point — warm undertones suit "
            "Indian skin perfectly. Saved for reference."
        ),
    },
    {
        "persona_name": "Divya",
        "persona_profile": "35yo boutique owner, Indiranagar, high disposable income",
        "watch_through": 83,
        "liked": False,
        "shared": False,
        "skipped_at": None,
        "comment": (
            "Looks nice but needs to feel more premium. Add the salon interior, the products "
            "used, the price range. Otherwise I'm not walking in."
        ),
    },
]


# ─── Main ────────────────────────────────────────────────────────────────────

def seed():
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == "creator@aura.demo").first():
            print("Already seeded. Run `python seed.py --reset` to wipe and reseed.")
            return

        print("Seeding AURA demo data...\n")

        # ── Download images ──────────────────────────────────────────────────
        print("Downloading placeholder images:")
        for t in TRANSFORMATIONS:
            t["before_image_url"] = download_image(t["before_url"], t["filename_before"])
            t["after_image_url"]  = download_image(t["after_url"],  t["filename_after"])

        # Mirror fallback image (pre-generated result for demo hardening)
        fallback_path = download_image(
            "https://picsum.photos/seed/mirror_fallback/400/500",
            "mirror_fallback.jpg"
        )
        print()

        # ── Users ────────────────────────────────────────────────────────────
        creator = User(
            name="Priya Sharma",
            email="creator@aura.demo",
            password_hash=hash_password("demo1234"),
            role="creator",
        )
        customer = User(
            name="Ananya Menon",
            email="customer@aura.demo",
            password_hash=hash_password("demo1234"),
            role="customer",
        )
        db.add_all([creator, customer])
        db.flush()

        # ── Salon ────────────────────────────────────────────────────────────
        salon = Salon(
            owner_id=creator.id,
            name="Studio Kesh",
            city="Bangalore",
            neighborhood="Koramangala",
            description=(
                "Koramangala's premium hair studio. Specialists in curly hair, balayage, "
                "and Korean glass-hair treatments. Walk-ins welcome on weekends."
            ),
        )
        db.add(salon)
        db.flush()

        # ── Transformations ──────────────────────────────────────────────────
        t_records = []
        for t in TRANSFORMATIONS:
            rec = Transformation(
                salon_id=salon.id,
                artist_name=t["artist_name"],
                service_type=t["service_type"],
                hair_texture_tag=t["hair_texture_tag"],
                before_image_url=t["before_image_url"],
                after_image_url=t["after_image_url"],
                style_description=t["style_description"],
                try_on_count=t["try_on_count"],
                created_at=datetime.utcnow(),
            )
            db.add(rec)
            t_records.append(rec)
        db.flush()

        # ── Video ────────────────────────────────────────────────────────────
        video = Video(
            salon_id=salon.id,
            creator_id=creator.id,
            video_url="https://sample-videos.com/video321/mp4/240/big_buck_bunny_240p_5mb.mp4",
            title="Studio Kesh — Balayage Transform Reel",
            status="published",
            virality_score=78.4,
            created_at=datetime.utcnow(),
        )
        db.add(video)
        db.flush()

        # ── Pre-saved simulation results ─────────────────────────────────────
        for p in PERSONA_RESULTS:
            db.add(SimulationResult(video_id=video.id, **p))

        # ── Demo booking ─────────────────────────────────────────────────────
        booking = Booking(
            customer_id=customer.id,
            transformation_id=t_records[0].id,
            salon_id=salon.id,
            status="confirmed",
            booked_at=datetime.utcnow(),
        )
        db.add(booking)

        db.commit()

        print("✅  Seed complete.\n")
        print(f"   Creator  →  creator@aura.demo / demo1234")
        print(f"   Customer →  customer@aura.demo / demo1234")
        print(f"   Salon: Studio Kesh (Koramangala) — id={salon.id}")
        print(f"   {len(t_records)} transformations, 1 published video (score 78.4), 1 booking")
        print(f"   Mirror fallback image: {fallback_path}")
        print()
        print("   ⚠  Swap picsum placeholders with real hair photos for max demo impact.")
        print(f"      Images are in: {STATIC_IMAGES}")

    except Exception as e:
        db.rollback()
        print(f"\n❌  Seed failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


def reset_and_seed():
    """Drop all rows and reseed — use carefully."""
    db = SessionLocal()
    try:
        for Model in [SimulationResult, Booking, Video, Transformation, Salon, User]:
            db.query(Model).delete()
        db.commit()
        print("Tables cleared.\n")
    finally:
        db.close()
    seed()


if __name__ == "__main__":
    if "--reset" in sys.argv:
        reset_and_seed()
    else:
        seed()
