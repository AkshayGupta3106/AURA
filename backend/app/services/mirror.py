import os
import time
import uuid
import base64
import requests
from pathlib import Path
from io import BytesIO
from PIL import Image

HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
PRIMARY_MODEL = "timbrooks/instruct-pix2pix"
FALLBACK_MODEL = "runwayml/stable-diffusion-v1-5"  # faster cold starts if primary times out

HF_PRIMARY_URL = f"https://api-inference.huggingface.co/models/{PRIMARY_MODEL}"
HF_FALLBACK_URL = f"https://api-inference.huggingface.co/models/{FALLBACK_MODEL}"

OUTPUT_DIR = Path("static/images")
MAX_SELFIE_DIM = 512   # pix2pix works best at 512x512
TIMEOUT = 60           # seconds — covers cold start window
COLD_START_WAIT = 25   # seconds to wait before retry on 503


def _build_instruction(style_description: str) -> str:
    return (
        f"Change this person's hair to: {style_description}. "
        "Keep the face, skin tone, and background exactly the same."
    )


def _resize_for_model(img: Image.Image) -> Image.Image:
    """Resize to 512x512 — pix2pix is trained at this resolution."""
    return img.resize((MAX_SELFIE_DIM, MAX_SELFIE_DIM), Image.LANCZOS)


def _img_to_bytes(img: Image.Image, fmt: str = "PNG") -> bytes:
    buf = BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def _call_hf(url: str, image_bytes: bytes, prompt: str) -> bytes | None:
    """
    POST to HuggingFace Inference API.
    Returns raw image bytes on success, None on unrecoverable error.
    Handles 503 cold-start with one retry after COLD_START_WAIT seconds.
    """
    if not HF_API_TOKEN:
        return None

    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}

    # pix2pix takes image as multipart + prompt in JSON params
    # HF Inference API accepts image/png body with x-use-cache and parameters headers
    for attempt in range(2):
        try:
            response = requests.post(
                url,
                headers={
                    **headers,
                    "Content-Type": "application/octet-stream",
                    "X-Use-Cache": "false",
                },
                params={"prompt": prompt} if "stable-diffusion" in url else {},
                data=image_bytes,
                timeout=TIMEOUT,
            )
        except requests.Timeout:
            return None

        if response.status_code == 200:
            return response.content

        if response.status_code == 503 and attempt == 0:
            # Model is loading — wait then retry once
            try:
                estimated = response.json().get("estimated_time", COLD_START_WAIT)
                wait = min(float(estimated), COLD_START_WAIT)
            except Exception:
                wait = COLD_START_WAIT
            time.sleep(wait)
            continue

        # Any other error — give up
        return None

    return None


def _call_pix2pix(image_bytes: bytes, style_description: str) -> bytes | None:
    """
    instruct-pix2pix expects multipart form with 'inputs' (image) and
    'parameters' containing the prompt.
    """
    if not HF_API_TOKEN:
        return None

    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    prompt = _build_instruction(style_description)

    for attempt in range(2):
        try:
            response = requests.post(
                HF_PRIMARY_URL,
                headers=headers,
                json={
                    "inputs": base64.b64encode(image_bytes).decode(),
                    "parameters": {"prompt": prompt},
                },
                timeout=TIMEOUT,
            )
        except requests.Timeout:
            return None

        if response.status_code == 200:
            return response.content

        if response.status_code == 503 and attempt == 0:
            try:
                wait = min(float(response.json().get("estimated_time", COLD_START_WAIT)), COLD_START_WAIT)
            except Exception:
                wait = COLD_START_WAIT
            time.sleep(wait)
            continue

        return None

    return None


def _call_img2img_fallback(image_bytes: bytes, style_description: str) -> bytes | None:
    """
    SD v1.5 img2img fallback — lower quality but faster cold starts.
    HF img2img pipeline takes the image as base64 in 'inputs'.
    """
    if not HF_API_TOKEN:
        return None

    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    prompt = f"Portrait photo, {style_description}, photorealistic, high quality"

    for attempt in range(2):
        try:
            response = requests.post(
                HF_FALLBACK_URL,
                headers=headers,
                json={
                    "inputs": base64.b64encode(image_bytes).decode(),
                    "parameters": {
                        "prompt": prompt,
                        "strength": 0.55,   # conservative — preserve face
                        "num_inference_steps": 20,
                    },
                },
                timeout=TIMEOUT,
            )
        except requests.Timeout:
            return None

        if response.status_code == 200:
            return response.content

        if response.status_code == 503 and attempt == 0:
            try:
                wait = min(float(response.json().get("estimated_time", COLD_START_WAIT)), COLD_START_WAIT)
            except Exception:
                wait = COLD_START_WAIT
            time.sleep(wait)
            continue

        return None

    return None


def run_mirror(selfie_path: str, style_description: str) -> str | None:
    """
    Main entry point for the mirror pipeline.

    selfie_path  — local filesystem path to uploaded selfie
    style_description — text from Gemini Flash (2.1)

    Returns URL path of the generated image (e.g. '/static/images/result_abc123.png'),
    or None if both primary and fallback fail.
    """
    if not HF_API_TOKEN:
        return None

    # Load + preprocess selfie
    try:
        img = Image.open(selfie_path).convert("RGB")
    except Exception:
        return None

    img = _resize_for_model(img)
    image_bytes = _img_to_bytes(img)

    # Try primary model first
    result_bytes = _call_pix2pix(image_bytes, style_description)

    # Fall back to SD img2img if primary fails
    if result_bytes is None:
        result_bytes = _call_img2img_fallback(image_bytes, style_description)

    if result_bytes is None:
        return None

    # Validate it's actually an image before saving
    try:
        Image.open(BytesIO(result_bytes)).verify()
    except Exception:
        return None

    # Save to static/images/
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"mirror_{uuid.uuid4().hex}.png"
    output_path = OUTPUT_DIR / filename

    with open(output_path, "wb") as f:
        f.write(result_bytes)

    return f"/static/images/{filename}"
