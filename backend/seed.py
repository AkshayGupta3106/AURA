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
    """Download image to /static/images/, return the /static/... URL path, or external URL if failed."""
    dest = os.path.join(STATIC_IMAGES, filename)
    if os.path.exists(dest):
        return f"/static/images/{filename}"
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            with open(dest, "wb") as f:
                f.write(r.content)
            print(f"  [OK] {filename}")
            return f"/static/images/{filename}"
        else:
            print(f"  [ERROR] {filename} (HTTP {r.status_code}) - using URL directly")
    except Exception as e:
        print(f"  [ERROR] {filename} ({e}) - using URL directly")
    return url


# ─── Salons & Transformations data ───────────────────────────────────────────
# Defining 15 realistic salons in Bangalore with distinct neighborhoods,
# descriptions, and 2-4 photo transformations mapped to high-quality Pexels images.

SALONS_DATA = [
    {
        "name": "Studio Kesh",
        "neighborhood": "Koramangala",
        "description": "Koramangala's premium hair studio. Specialists in curly hair, balayage, and Korean glass-hair treatments. Walk-ins welcome on weekends.",
        "transformations": [
            {
                "filename_before": "t1_before.jpg",
                "filename_after": "t1_after.jpg",
                "before_url": "https://images.pexels.com/photos/15191983/pexels-photo-15191983.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191983.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/5368632/pexels-photo-5368632.jpeg?cs=srgb&dl=pexels-sergeymakashin-5368632.jpg&fm=jpg",
                "artist_name": "Deepika R",
                "service_type": "Balayage",
                "hair_texture_tag": "straight",
                "style_description": "Warm honey-blonde balayage on straight, shoulder-length hair with subtle caramel highlights that blend seamlessly from mid-shaft to tips. High shine, silky texture with a natural sun-kissed finish.",
                "try_on_count": 24,
            },
            {
                "filename_before": "t2_before.jpg",
                "filename_after": "t2_after.jpg",
                "before_url": "https://images.pexels.com/photos/7440133/pexels-photo-7440133.jpeg?cs=srgb&dl=pexels-cottonbro-7440133.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/7755226/pexels-photo-7755226.jpeg?cs=srgb&dl=pexels-rdne-7755226.jpg&fm=jpg",
                "artist_name": "Meena K",
                "service_type": "Curly Transformation",
                "hair_texture_tag": "wavy",
                "style_description": "Voluminous, defined curls with a deep side part on medium-length hair. Rich dark brown with soft, bouncy spirals from root to tip. Zero frizz, maximum definition.",
                "try_on_count": 11,
            },
            {
                "filename_before": "t3_before.jpg",
                "filename_after": "t3_after.jpg",
                "before_url": "https://images.pexels.com/photos/10318038/pexels-photo-10318038.jpeg?cs=srgb&dl=pexels-ron-lach-10318038.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/28994388/pexels-photo-28994388.jpeg?cs=srgb&dl=pexels-thefullonmonet-28994388.jpg&fm=jpg",
                "artist_name": "Deepika R",
                "service_type": "Korean Glass Hair",
                "hair_texture_tag": "straight",
                "style_description": "Pin-straight, ultra-glossy black hair falling to collar-bone length with a centre part. Mirror-like shine with an ethereal smooth finish — no flyaways, no texture.",
                "try_on_count": 38,
            },
            {
                "filename_before": "t4_before.jpg",
                "filename_after": "t4_after.jpg",
                "before_url": "https://images.pexels.com/photos/3992861/pexels-photo-3992861.jpeg?cs=srgb&dl=pexels-cottonbro-3992861.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/15191985/pexels-photo-15191985.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191985.jpg&fm=jpg",
                "artist_name": "Ritu S",
                "service_type": "Short Bob",
                "hair_texture_tag": "curly",
                "style_description": "Chic jaw-length bob on natural curly hair with a slight inward curl at the ends. Rich espresso brown with a mahogany undertone. Full body from root with lightweight, airy curl definition.",
                "try_on_count": 7,
            }
        ]
    },
    {
        "name": "The Mane Society",
        "neighborhood": "Indiranagar",
        "description": "Indiranagar's premium space for modern coloring, precision cutting, and customized hair treatments. Relaxed vibes with expert consultation.",
        "transformations": [
            {
                "filename_before": "t5_before.jpg",
                "filename_after": "t5_after.jpg",
                "before_url": "https://images.pexels.com/photos/7755473/pexels-photo-7755473.jpeg?cs=srgb&dl=pexels-rdne-7755473.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/5368632/pexels-photo-5368632.jpeg?cs=srgb&dl=pexels-sergeymakashin-5368632.jpg&fm=jpg",
                "artist_name": "Rohan V",
                "service_type": "Highlights",
                "hair_texture_tag": "wavy",
                "style_description": "Sun-kissed highlights on rich brown wavy hair, creating depth and dimension with soft, natural tones.",
                "try_on_count": 18,
            },
            {
                "filename_before": "t6_before.jpg",
                "filename_after": "t6_after.jpg",
                "before_url": "https://images.pexels.com/photos/10318038/pexels-photo-10318038.jpeg?cs=srgb&dl=pexels-ron-lach-10318038.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/15191985/pexels-photo-15191985.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191985.jpg&fm=jpg",
                "artist_name": "Sneha M",
                "service_type": "Haircut",
                "hair_texture_tag": "straight",
                "style_description": "Long layers with face-framing fringe, adding texture and motion to straight, thick hair.",
                "try_on_count": 9,
            },
            {
                "filename_before": "t7_before.jpg",
                "filename_after": "t7_after.jpg",
                "before_url": "https://images.pexels.com/photos/15191983/pexels-photo-15191983.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191983.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/5368629/pexels-photo-5368629.jpeg?cs=srgb&dl=pexels-sergeymakashin-5368629.jpg&fm=jpg",
                "artist_name": "Rohan V",
                "service_type": "Keratin Treatment",
                "hair_texture_tag": "wavy",
                "style_description": "Smoothing keratin treatment that tames frizz and adds a sleek, reflective gloss to natural waves.",
                "try_on_count": 15,
            }
        ]
    },
    {
        "name": "Aura Hair Atelier",
        "neighborhood": "HSR Layout",
        "description": "A cozy, premium boutique salon in HSR Layout specializing in seamless hair extensions, customized colors, and high-fashion blowouts.",
        "transformations": [
            {
                "filename_before": "t8_before.jpg",
                "filename_after": "t8_after.jpg",
                "before_url": "https://images.pexels.com/photos/7440133/pexels-photo-7440133.jpeg?cs=srgb&dl=pexels-cottonbro-7440133.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/28994388/pexels-photo-28994388.jpeg?cs=srgb&dl=pexels-thefullonmonet-28994388.jpg&fm=jpg",
                "artist_name": "Mansi P",
                "service_type": "Hair Extensions",
                "hair_texture_tag": "straight",
                "style_description": "Seamless tape-in extensions adding 6 inches of length and full volume, color-matched to natural caramel blonde.",
                "try_on_count": 27,
            },
            {
                "filename_before": "t9_before.jpg",
                "filename_after": "t9_after.jpg",
                "before_url": "https://images.pexels.com/photos/3992861/pexels-photo-3992861.jpeg?cs=srgb&dl=pexels-cottonbro-3992861.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/15191980/pexels-photo-15191980.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191980.jpg&fm=jpg",
                "artist_name": "Mansi P",
                "service_type": "Balayage",
                "hair_texture_tag": "wavy",
                "style_description": "Soft, hand-painted ash-brown balayage with a seamless transition from dark roots to cool blonde ends.",
                "try_on_count": 14,
            },
            {
                "filename_before": "t10_before.jpg",
                "filename_after": "t10_after.jpg",
                "before_url": "https://images.pexels.com/photos/15191980/pexels-photo-15191980.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191980.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/7755226/pexels-photo-7755226.jpeg?cs=srgb&dl=pexels-rdne-7755226.jpg&fm=jpg",
                "artist_name": "Amit S",
                "service_type": "Blowout",
                "hair_texture_tag": "curly",
                "style_description": "Bouncy, red-carpet blowout with voluminous curls and maximum root lift for a glam evening look.",
                "try_on_count": 22,
            }
        ]
    },
    {
        "name": "Whitefield Hair Lab",
        "neighborhood": "Whitefield",
        "description": "Located in the heart of IT corridor, Whitefield Hair Lab offers fast-paced, high-tech hair care, trend-led styling, and deep protein treatments.",
        "transformations": [
            {
                "filename_before": "t11_before.jpg",
                "filename_after": "t11_after.jpg",
                "before_url": "https://images.pexels.com/photos/34930126/pexels-photo-34930126.jpeg?cs=srgb&dl=pexels-jose-antonio-otegui-auzmendi-2150489988-34930126.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/5368632/pexels-photo-5368632.jpeg?cs=srgb&dl=pexels-sergeymakashin-5368632.jpg&fm=jpg",
                "artist_name": "Zoya K",
                "service_type": "Hair Color",
                "hair_texture_tag": "wavy",
                "style_description": "Rich chocolate brown base color with subtle mahogany undertones, giving a fresh and healthy color reset.",
                "try_on_count": 31,
            },
            {
                "filename_before": "t12_before.jpg",
                "filename_after": "t12_after.jpg",
                "before_url": "https://images.pexels.com/photos/15191983/pexels-photo-15191983.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191983.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/15191985/pexels-photo-15191985.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191985.jpg&fm=jpg",
                "artist_name": "Rahul G",
                "service_type": "Protein Treatment",
                "hair_texture_tag": "curly",
                "style_description": "Deep nourishing protein treatment restoring elasticity, softness, and shine to heat-damaged curls.",
                "try_on_count": 12,
            }
        ]
    },
    {
        "name": "Jayanagar Styling Co.",
        "neighborhood": "Jayanagar",
        "description": "Traditional meets modern. We specialize in precision cuts, beard grooming, and hair smoothening for a refined daily look.",
        "transformations": [
            {
                "filename_before": "t13_before.jpg",
                "filename_after": "t13_after.jpg",
                "before_url": "https://images.pexels.com/photos/10318038/pexels-photo-10318038.jpeg?cs=srgb&dl=pexels-ron-lach-10318038.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/28994388/pexels-photo-28994388.jpeg?cs=srgb&dl=pexels-thefullonmonet-28994388.jpg&fm=jpg",
                "artist_name": "Rohit S",
                "service_type": "Haircut",
                "hair_texture_tag": "straight",
                "style_description": "Classic textured crop with a clean taper fade, bringing modern structure to unruly thick hair.",
                "try_on_count": 40,
            },
            {
                "filename_before": "t14_before.jpg",
                "filename_after": "t14_after.jpg",
                "before_url": "https://images.pexels.com/photos/7755473/pexels-photo-7755473.jpeg?cs=srgb&dl=pexels-rdne-7755473.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/5368629/pexels-photo-5368629.jpeg?cs=srgb&dl=pexels-sergeymakashin-5368629.jpg&fm=jpg",
                "artist_name": "Pooja R",
                "service_type": "Smoothening",
                "hair_texture_tag": "wavy",
                "style_description": "Intense smoothening treatment reducing bulk and frizz, leaving hair exceptionally soft and easy to style.",
                "try_on_count": 17,
            }
        ]
    },
    {
        "name": "Grace & Glow",
        "neighborhood": "JP Nagar",
        "description": "JP Nagar's favorite destination for elegant bridal styling, rejuvenating hair spas, and delicate highlight designs.",
        "transformations": [
            {
                "filename_before": "t15_before.jpg",
                "filename_after": "t15_after.jpg",
                "before_url": "https://images.pexels.com/photos/3992861/pexels-photo-3992861.jpeg?cs=srgb&dl=pexels-cottonbro-3992861.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/7755226/pexels-photo-7755226.jpeg?cs=srgb&dl=pexels-rdne-7755226.jpg&fm=jpg",
                "artist_name": "Ritika K",
                "service_type": "Bridal Styling",
                "hair_texture_tag": "wavy",
                "style_description": "Intricate bridal updo with soft curls and pearl accents, secured for long-wear comfort.",
                "try_on_count": 29,
            },
            {
                "filename_before": "t16_before.jpg",
                "filename_after": "t16_after.jpg",
                "before_url": "https://images.pexels.com/photos/7440133/pexels-photo-7440133.jpeg?cs=srgb&dl=pexels-cottonbro-7440133.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/15191985/pexels-photo-15191985.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191985.jpg&fm=jpg",
                "artist_name": "Neha N",
                "service_type": "Hair Spa",
                "hair_texture_tag": "straight",
                "style_description": "Moisturizing scalp therapy and deep-conditioning mask, reviving lifeless and dry strands.",
                "try_on_count": 8,
            }
        ]
    },
    {
        "name": "Urban Shear Studio",
        "neighborhood": "Malleshwaram",
        "description": "A modern unisex salon offering sharp haircuts, clean beard trims, and refreshing scalp detox services in Malleshwaram.",
        "transformations": [
            {
                "filename_before": "t17_before.jpg",
                "filename_after": "t17_after.jpg",
                "before_url": "https://images.pexels.com/photos/34930126/pexels-photo-34930126.jpeg?cs=srgb&dl=pexels-jose-antonio-otegui-auzmendi-2150489988-34930126.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/28994388/pexels-photo-28994388.jpeg?cs=srgb&dl=pexels-thefullonmonet-28994388.jpg&fm=jpg",
                "artist_name": "Arjun N",
                "service_type": "Haircut",
                "hair_texture_tag": "straight",
                "style_description": "Sharp asymmetrical bob cut that highlights the jawline with a clean, blunt perimeter.",
                "try_on_count": 16,
            },
            {
                "filename_before": "t18_before.jpg",
                "filename_after": "t18_after.jpg",
                "before_url": "https://images.pexels.com/photos/15191980/pexels-photo-15191980.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191980.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/5368632/pexels-photo-5368632.jpeg?cs=srgb&dl=pexels-sergeymakashin-5368632.jpg&fm=jpg",
                "artist_name": "Arjun N",
                "service_type": "Beard Trim",
                "hair_texture_tag": "wavy",
                "style_description": "Sharp beard line-up with a hot towel finish, using natural oils for a healthy, groomed look.",
                "try_on_count": 25,
            }
        ]
    },
    {
        "name": "Tress & Canvas",
        "neighborhood": "Hebbal",
        "description": "A spacious, bright studio in Hebbal offering creative coloring, professional blowout bars, and customized hair care.",
        "transformations": [
            {
                "filename_before": "t19_before.jpg",
                "filename_after": "t19_after.jpg",
                "before_url": "https://images.pexels.com/photos/7755473/pexels-photo-7755473.jpeg?cs=srgb&dl=pexels-rdne-7755473.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/15191980/pexels-photo-15191980.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191980.jpg&fm=jpg",
                "artist_name": "Priyanka S",
                "service_type": "Hair Color",
                "hair_texture_tag": "straight",
                "style_description": "Vibrant copper hair color transformation, creating a bold and warm statement tone.",
                "try_on_count": 34,
            },
            {
                "filename_before": "t20_before.jpg",
                "filename_after": "t20_after.jpg",
                "before_url": "https://images.pexels.com/photos/10318038/pexels-photo-10318038.jpeg?cs=srgb&dl=pexels-ron-lach-10318038.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/7755226/pexels-photo-7755226.jpeg?cs=srgb&dl=pexels-rdne-7755226.jpg&fm=jpg",
                "artist_name": "Vikram M",
                "service_type": "Blowout",
                "hair_texture_tag": "wavy",
                "style_description": "Sleek blowout with flipped ends, perfect for transitions from office to evening dinners.",
                "try_on_count": 13,
            }
        ]
    },
    {
        "name": "Kesh Couture",
        "neighborhood": "Electronic City",
        "description": "Tech-professionals' top choice for stress-free hair care, perm styles, and long-lasting hair extensions in Electronic City.",
        "transformations": [
            {
                "filename_before": "t21_before.jpg",
                "filename_after": "t21_after.jpg",
                "before_url": "https://images.pexels.com/photos/7440133/pexels-photo-7440133.jpeg?cs=srgb&dl=pexels-cottonbro-7440133.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/7755226/pexels-photo-7755226.jpeg?cs=srgb&dl=pexels-rdne-7755226.jpg&fm=jpg",
                "artist_name": "Farah K",
                "service_type": "Perm",
                "hair_texture_tag": "curly",
                "style_description": "Modern digital perm creating soft, bouncy, low-maintenance waves on straight hair.",
                "try_on_count": 19,
            },
            {
                "filename_before": "t22_before.jpg",
                "filename_after": "t22_after.jpg",
                "before_url": "https://images.pexels.com/photos/34930126/pexels-photo-34930126.jpeg?cs=srgb&dl=pexels-jose-antonio-otegui-auzmendi-2150489988-34930126.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/28994388/pexels-photo-28994388.jpeg?cs=srgb&dl=pexels-thefullonmonet-28994388.jpg&fm=jpg",
                "artist_name": "Neha K",
                "service_type": "Hair Extensions",
                "hair_texture_tag": "straight",
                "style_description": "Premium micro-ring extensions adding subtle thickness and pastel highlights without dye.",
                "try_on_count": 22,
            }
        ]
    },
    {
        "name": "The Hair Collective",
        "neighborhood": "Marathahalli",
        "description": "A vibrant community-focused salon in Marathahalli offering friendly service, clean fades, and restorative hair spa packages.",
        "transformations": [
            {
                "filename_before": "t23_before.jpg",
                "filename_after": "t23_after.jpg",
                "before_url": "https://images.pexels.com/photos/15191983/pexels-photo-15191983.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191983.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/15191985/pexels-photo-15191985.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191985.jpg&fm=jpg",
                "artist_name": "Karan J",
                "service_type": "Haircut",
                "hair_texture_tag": "straight",
                "style_description": "Disconnected undercut with a textured top, perfect for summer styling and ease.",
                "try_on_count": 10,
            },
            {
                "filename_before": "t24_before.jpg",
                "filename_after": "t24_after.jpg",
                "before_url": "https://images.pexels.com/photos/3992861/pexels-photo-3992861.jpeg?cs=srgb&dl=pexels-cottonbro-3992861.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/5368629/pexels-photo-5368629.jpeg?cs=srgb&dl=pexels-sergeymakashin-5368629.jpg&fm=jpg",
                "artist_name": "Nisha B",
                "service_type": "Hair Spa",
                "hair_texture_tag": "wavy",
                "style_description": "Hydrating hair mask with steam infusion, taming dryness and adding deep shine.",
                "try_on_count": 14,
            }
        ]
    },
    {
        "name": "Basavanagudi Hair House",
        "neighborhood": "Basavanagudi",
        "description": "Established hair experts bringing decades of experience in traditional styling, hair strengthening, and classic cuts.",
        "transformations": [
            {
                "filename_before": "t25_before.jpg",
                "filename_after": "t25_after.jpg",
                "before_url": "https://images.pexels.com/photos/10318038/pexels-photo-10318038.jpeg?cs=srgb&dl=pexels-ron-lach-10318038.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/7755226/pexels-photo-7755226.jpeg?cs=srgb&dl=pexels-rdne-7755226.jpg&fm=jpg",
                "artist_name": "Asha I",
                "service_type": "Bridal Styling",
                "hair_texture_tag": "curly",
                "style_description": "Classic braid styling with fresh jasmine flowers (gajra) for a traditional festive aesthetic.",
                "try_on_count": 45,
            },
            {
                "filename_before": "t26_before.jpg",
                "filename_after": "t26_after.jpg",
                "before_url": "https://images.pexels.com/photos/7755473/pexels-photo-7755473.jpeg?cs=srgb&dl=pexels-rdne-7755473.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/15191980/pexels-photo-15191980.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191980.jpg&fm=jpg",
                "artist_name": "Asha I",
                "service_type": "Haircut",
                "hair_texture_tag": "wavy",
                "style_description": "A neat, medium-length U-cut adding volume and bounce to fine hair.",
                "try_on_count": 12,
            }
        ]
    },
    {
        "name": "Sadashivanagar Elite",
        "neighborhood": "Sadashivanagar",
        "description": "An upscale, appointment-only luxury studio catering to clients who want the absolute best in dimensional color and scalp health.",
        "transformations": [
            {
                "filename_before": "t27_before.jpg",
                "filename_after": "t27_after.jpg",
                "before_url": "https://images.pexels.com/photos/3992861/pexels-photo-3992861.jpeg?cs=srgb&dl=pexels-cottonbro-3992861.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/15191980/pexels-photo-15191980.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191980.jpg&fm=jpg",
                "artist_name": "Ritu S",
                "service_type": "Balayage",
                "hair_texture_tag": "straight",
                "style_description": "High-contrast platinum blonde balayage, meticulously blended to minimize root growth line.",
                "try_on_count": 55,
            },
            {
                "filename_before": "t28_before.jpg",
                "filename_after": "t28_after.jpg",
                "before_url": "https://images.pexels.com/photos/7440133/pexels-photo-7440133.jpeg?cs=srgb&dl=pexels-cottonbro-7440133.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/5368632/pexels-photo-5368632.jpeg?cs=srgb&dl=pexels-sergeymakashin-5368632.jpg&fm=jpg",
                "artist_name": "Deepika R",
                "service_type": "Keratin Treatment",
                "hair_texture_tag": "straight",
                "style_description": "Formaldehyde-free smoothing treatment that leaves hair silk-straight and radiant.",
                "try_on_count": 28,
            }
        ]
    },
    {
        "name": "Glow & Co. Salon",
        "neighborhood": "Koramangala",
        "description": "A trendy Koramangala spot popular for quick blowouts, vibrant highlights, and smooth Brazilian blowout treatments.",
        "transformations": [
            {
                "filename_before": "t29_before.jpg",
                "filename_after": "t29_after.jpg",
                "before_url": "https://images.pexels.com/photos/34930126/pexels-photo-34930126.jpeg?cs=srgb&dl=pexels-jose-antonio-otegui-auzmendi-2150489988-34930126.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/15191985/pexels-photo-15191985.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191985.jpg&fm=jpg",
                "artist_name": "Mansi P",
                "service_type": "Highlights",
                "hair_texture_tag": "straight",
                "style_description": "Face-framing money piece highlights in warm caramel tones to brighten the complexion.",
                "try_on_count": 37,
            },
            {
                "filename_before": "t30_before.jpg",
                "filename_after": "t30_after.jpg",
                "before_url": "https://images.pexels.com/photos/15191983/pexels-photo-15191983.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191983.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/5368629/pexels-photo-5368629.jpeg?cs=srgb&dl=pexels-sergeymakashin-5368629.jpg&fm=jpg",
                "artist_name": "Mansi P",
                "service_type": "Brazilian Blowout",
                "hair_texture_tag": "wavy",
                "style_description": "Professional Brazilian blowout restoring smoothness, shine, and reducing daily blow-dry time.",
                "try_on_count": 16,
            }
        ]
    },
    {
        "name": "Velvet Tresses",
        "neighborhood": "Indiranagar",
        "description": "Indiranagar's boutique studio offering personalized extensions, artistic fashion shades, and scalp rejuvenation therapies.",
        "transformations": [
            {
                "filename_before": "t31_before.jpg",
                "filename_after": "t31_after.jpg",
                "before_url": "https://images.pexels.com/photos/15191980/pexels-photo-15191980.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191980.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/5368632/pexels-photo-5368632.jpeg?cs=srgb&dl=pexels-sergeymakashin-5368632.jpg&fm=jpg",
                "artist_name": "Sneha M",
                "service_type": "Hair Color",
                "hair_texture_tag": "straight",
                "style_description": "Deep plum-burgundy fashion color that catches the light beautifully with high shine.",
                "try_on_count": 21,
            },
            {
                "filename_before": "t32_before.jpg",
                "filename_after": "t32_after.jpg",
                "before_url": "https://images.pexels.com/photos/10318038/pexels-photo-10318038.jpeg?cs=srgb&dl=pexels-ron-lach-10318038.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/28994388/pexels-photo-28994388.jpeg?cs=srgb&dl=pexels-thefullonmonet-28994388.jpg&fm=jpg",
                "artist_name": "Rohan V",
                "service_type": "Scalp Detox",
                "hair_texture_tag": "wavy",
                "style_description": "Exfoliating clay mask and massage to deeply cleanse and revive the scalp environment.",
                "try_on_count": 14,
            }
        ]
    },
    {
        "name": "The Curly Specialist",
        "neighborhood": "HSR Layout",
        "description": "Bangalore's dedicated salon for natural waves, curls, and coils. We specialize in dry cuts, curl hydration, and protective styling.",
        "transformations": [
            {
                "filename_before": "t33_before.jpg",
                "filename_after": "t33_after.jpg",
                "before_url": "https://images.pexels.com/photos/7440133/pexels-photo-7440133.jpeg?cs=srgb&dl=pexels-cottonbro-7440133.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/7755226/pexels-photo-7755226.jpeg?cs=srgb&dl=pexels-rdne-7755226.jpg&fm=jpg",
                "artist_name": "Kavya S",
                "service_type": "Curly Transformation",
                "hair_texture_tag": "curly",
                "style_description": "Dry curl-by-curl cut and styling, defining natural ringlets with hydration styling.",
                "try_on_count": 39,
            },
            {
                "filename_before": "t34_before.jpg",
                "filename_after": "t34_after.jpg",
                "before_url": "https://images.pexels.com/photos/3992861/pexels-photo-3992861.jpeg?cs=srgb&dl=pexels-cottonbro-3992861.jpg&fm=jpg",
                "after_url": "https://images.pexels.com/photos/15191985/pexels-photo-15191985.jpeg?cs=srgb&dl=pexels-andres-chirrisco-174853810-15191985.jpg&fm=jpg",
                "artist_name": "Kavya S",
                "service_type": "Perm",
                "hair_texture_tag": "curly",
                "style_description": "Bouncy spiral perm adding volume and beautiful movement to straight flat hair.",
                "try_on_count": 18,
            }
        ]
    }
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
        "persona_profile": "19yo college student, Indiranagar, trends-follower, low attention span",
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
        "comment": "Technique looks clean. The colour theory is on point — warm undertones suit Indian skin perfectly. Saved for reference.",
    },
    {
        "persona_name": "Divya",
        "persona_profile": "35yo budget-conscious, Electronic City, skips expensive content early",
        "watch_through": 83,
        "liked": False,
        "shared": False,
        "skipped_at": None,
        "comment": "Looks nice but needs to feel more premium. Add the salon interior, the products used, the price range. Otherwise I'm not walking in.",
    },
]


# ─── Main ────────────────────────────────────────────────────────────────────

def seed():
    db = SessionLocal()
    try:
        # Check if already seeded with at least 10 salons
        if db.query(Salon).count() >= 10:
            print("Already seeded with 10+ salons. Skipping.")
            return

        print("Seeding AURA demo data with 15 realistic salons...\n")

        # ── Users ────────────────────────────────────────────────────────────
        creator = User(
            name="Priya Sharma",
            username="creator",
            password_hash=hash_password("demo1234"),
            role="creator",
        )
        customer = User(
            name="Ananya Menon",
            username="customer",
            password_hash=hash_password("demo1234"),
            role="customer",
        )
        db.add_all([creator, customer])
        db.flush()

        # Mirror fallback image (pre-generated result for demo hardening)
        fallback_path = download_image(
            "https://picsum.photos/seed/mirror_fallback/400/500",
            "mirror_fallback.jpg"
        )
        print()

        # ── Salons & Transformations ──────────────────────────────────────────
        print("Downloading placeholder images and seeding salons:")
        first_salon = None
        first_transformation = None

        for salon_info in SALONS_DATA:
            salon = Salon(
                owner_id=creator.id,
                name=salon_info["name"],
                city="Bangalore",
                neighborhood=salon_info["neighborhood"],
                description=salon_info["description"],
            )
            db.add(salon)
            db.flush()

            print(f"  Seeding salon: {salon.name} ({salon.neighborhood})")

            if not first_salon:
                first_salon = salon

            for t in salon_info["transformations"]:
                before_image_url = download_image(t["before_url"], t["filename_before"])
                after_image_url  = download_image(t["after_url"],  t["filename_after"])

                rec = Transformation(
                    salon_id=salon.id,
                    artist_name=t["artist_name"],
                    service_type=t["service_type"],
                    hair_texture_tag=t["hair_texture_tag"],
                    before_image_url=before_image_url,
                    after_image_url=after_image_url,
                    style_description=t["style_description"],
                    try_on_count=t["try_on_count"],
                    created_at=datetime.utcnow(),
                )
                db.add(rec)
                db.flush()

                if not first_transformation:
                    first_transformation = rec

        # ── Video for first salon ────────────────────────────────────────────
        video = Video(
            salon_id=first_salon.id,
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
            transformation_id=first_transformation.id,
            salon_id=first_salon.id,
            status="confirmed",
            booked_at=datetime.utcnow(),
        )
        db.add(booking)

        db.commit()

        print("SUCCESS  Seed complete.\n")
        print(f"   Creator  -->  creator / demo1234")
        print(f"   Customer -->  customer / demo1234")
        print(f"   Seeded {len(SALONS_DATA)} salons in total.")
        print(f"   Mirror fallback image: {fallback_path}")
        print()

    except Exception as e:
        db.rollback()
        print(f"\nERROR  Seed failed: {e}")
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
