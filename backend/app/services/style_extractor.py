import base64
import os
import requests
from pathlib import Path

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.0-flash-exp:free"

STYLE_PROMPT = (
    "Describe only the hairstyle in this image in 1–2 sentences. "
    "Include: hair type (curly/straight/wavy), length, color, texture, and volume. "
    "Be specific and visual. No other commentary."
)


def _image_to_base64(image_path: str) -> tuple[str, str]:
    """Returns (base64_data, media_type)."""
    path = Path(image_path)
    ext = path.suffix.lower()
    media_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }.get(ext, "image/jpeg")

    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode(), media_type


def extract_style_description(after_image_path: str) -> str | None:
    """
    Sends the after-photo to Gemini Flash via OpenRouter.
    Returns the style description string, or None on failure.

    after_image_path is the local filesystem path (not the /static URL).
    """
    if not OPENROUTER_API_KEY:
        return None

    # Strip leading slash so Path works: "/static/images/x.jpg" → "static/images/x.jpg"
    local_path = after_image_path.lstrip("/")

    try:
        b64, media_type = _image_to_base64(local_path)
    except FileNotFoundError:
        return None

    payload = {
        "model": MODEL,
        "max_tokens": 150,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{media_type};base64,{b64}"
                        },
                    },
                    {"type": "text", "text": STYLE_PROMPT},
                ],
            }
        ],
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",   # required by OpenRouter
    }

    try:
        r = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=30)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return None
