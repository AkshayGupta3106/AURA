import base64
import json
import os
import re
import time
from pathlib import Path

import requests

from app.services.personas import PERSONAS

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.0-flash-exp:free"

TIMEOUT = 45


# ── Prompt builder ────────────────────────────────────────────────────────────

def _build_prompt(persona: dict, video_title: str, duration_sec: float, num_frames: int) -> str:
    return (
        f"You are {persona['name']}, {persona['age']} years old, {persona['occupation']}, "
        f"based in {persona['location']}.\n"
        f"Your behavior: {persona['behavior']}.\n\n"
        f"Full profile: {persona['full_profile']}\n\n"
        f"You just watched a {duration_sec:.0f}-second Instagram Reel from a salon, "
        f"titled \"{video_title}\". "
        f"The {num_frames} key frames from the video (in chronological order) are attached.\n\n"
        "Based on your personality, respond ONLY with a single JSON object. "
        "No markdown. No backticks. No explanation before or after:\n\n"
        "{\n"
        '  "watch_through": <integer 0-100, percentage of video you watched>,\n'
        '  "liked": <true or false>,\n'
        '  "shared": <true or false>,\n'
        '  "skipped_at": <null if you watched past 80%, otherwise integer seconds when you stopped>,\n'
        '  "comment": <your authentic 1-sentence comment as this persona, or null if you said nothing>\n'
        "}\n\n"
        "Return ONLY the JSON. No markdown. No backticks. No explanation."
    )


# ── Image encoding ────────────────────────────────────────────────────────────

def _frame_to_content_block(frame_url: str) -> dict | None:
    local_path = frame_url.lstrip("/")
    try:
        data = Path(local_path).read_bytes()
        b64 = base64.b64encode(data).decode()
        return {
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
        }
    except FileNotFoundError:
        return None


# ── JSON extraction with fallback ─────────────────────────────────────────────

def _extract_json(raw: str) -> dict | None:
    """Try to parse JSON from the raw model response, stripping markdown fences."""
    raw = raw.strip()
    # Strip ```json ... ``` or ``` ... ```
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Try extracting the first {...} block
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                return None
    return None


def _validate_result(result: dict) -> dict:
    """Clamp and type-coerce a parsed persona result into a clean dict."""
    return {
        "watch_through": max(0, min(100, int(result.get("watch_through", 50)))),
        "liked": bool(result.get("liked", False)),
        "shared": bool(result.get("shared", False)),
        "skipped_at": (float(result["skipped_at"]) if result.get("skipped_at") is not None else None),
        "comment": str(result["comment"]) if result.get("comment") else None,
    }


# ── Per-persona OpenRouter call ───────────────────────────────────────────────

def simulate_one_persona(
    persona: dict,
    frame_urls: list[str],
    video_title: str,
    duration_sec: float,
) -> dict:
    """
    Call Gemini Flash via OpenRouter with this persona's prompt + all video frames.
    Returns a validated result dict. Falls back to a synthetic result on any failure.
    """
    content_blocks = []

    for url in frame_urls:
        block = _frame_to_content_block(url)
        if block:
            content_blocks.append(block)

    prompt_text = _build_prompt(persona, video_title, duration_sec, len(content_blocks))
    content_blocks.append({"type": "text", "text": prompt_text})

    if not OPENROUTER_API_KEY:
        return _synthetic_fallback(persona)

    payload = {
        "model": MODEL,
        "max_tokens": 300,
        "messages": [{"role": "user", "content": content_blocks}],
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
    }

    for attempt in range(2):
        try:
            r = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=TIMEOUT)
        except requests.Timeout:
            break

        if r.status_code == 200:
            raw = r.json()["choices"][0]["message"]["content"]
            parsed = _extract_json(raw)
            if parsed:
                try:
                    return _validate_result(parsed)
                except (KeyError, ValueError, TypeError):
                    pass
            # Malformed JSON — try once more with a stricter prompt
            if attempt == 0:
                content_blocks[-1] = {
                    "type": "text",
                    "text": prompt_text + "\n\nCRITICAL: Return ONLY raw JSON starting with { and ending with }.",
                }
                continue

        elif r.status_code == 429 and attempt == 0:
            time.sleep(5)
            continue

        break

    return _synthetic_fallback(persona)


def _synthetic_fallback(persona: dict) -> dict:
    """
    Deterministic per-persona fallback when OpenRouter is unavailable.
    Values are crafted to match each persona's documented behavior.
    """
    fallbacks = {
        "Priya":  {"watch_through": 45, "liked": False, "shared": False, "skipped_at": 8,    "comment": "What's the price for this?"},
        "Ananya": {"watch_through": 85, "liked": True,  "shared": True,  "skipped_at": None, "comment": "So beautiful! Sharing this with my group."},
        "Riya":   {"watch_through": 30, "liked": True,  "shared": True,  "skipped_at": 6,    "comment": "omg need this immediately 😭"},
        "Meera":  {"watch_through": 95, "liked": True,  "shared": False, "skipped_at": None, "comment": "The balayage technique here is really clean — great colour melt."},
        "Divya":  {"watch_through": 60, "liked": False, "shared": False, "skipped_at": 12,   "comment": None},
    }
    return fallbacks.get(persona["name"], {
        "watch_through": 50, "liked": False, "shared": False, "skipped_at": None, "comment": None,
    })


# ── Virality score formula ────────────────────────────────────────────────────

def compute_virality_score(results: list[dict]) -> tuple[float, dict]:
    """
    Returns (virality_score 0-100, breakdown dict with 4 components).

    hook_rate       — % who watched past the 5s mark (skipped_at > 5 or null)
    completion      — average watch_through across all personas
    social_velocity — share rate
    sentiment       — like rate
    """
    n = len(results)
    if n == 0:
        return 0.0, {}

    hooked = sum(1 for r in results if r["skipped_at"] is None or r["skipped_at"] > 5)
    hook_rate = (hooked / n) * 100

    completion = sum(r["watch_through"] for r in results) / n

    shared = sum(1 for r in results if r["shared"])
    social_velocity = (shared / n) * 100

    liked = sum(1 for r in results if r["liked"])
    sentiment = (liked / n) * 100

    score = (
        hook_rate       * 0.30 +
        completion      * 0.25 +
        social_velocity * 0.25 +
        sentiment       * 0.20
    )
    score = round(min(max(score, 0.0), 100.0), 1)

    breakdown = {
        "hook_rate":       round(hook_rate, 1),
        "completion":      round(completion, 1),
        "social_velocity": round(social_velocity, 1),
        "sentiment":       round(sentiment, 1),
    }

    return score, breakdown
