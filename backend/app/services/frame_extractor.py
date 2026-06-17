import uuid
from pathlib import Path

import cv2

FRAMES_DIR = Path("static/frames")
MAX_FRAMES = 5
FRAME_INTERVAL_SEC = 5   # one frame every 5 seconds


def extract_frames(video_url: str, max_frames: int = MAX_FRAMES) -> list[str]:
    """
    Extract up to `max_frames` evenly-spaced key frames from a video.

    video_url  — stored URL like '/static/videos/abc.mp4'
    Returns    — list of '/static/frames/...' URL paths (local paths are just url.lstrip('/'))
    """
    local_path = video_url.lstrip("/")  # '/static/videos/x.mp4' → 'static/videos/x.mp4'
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(local_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {local_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_sec = total_frames / fps

    # Decide timestamps: one every FRAME_INTERVAL_SEC, capped at max_frames
    raw_timestamps = [i * FRAME_INTERVAL_SEC for i in range(int(duration_sec // FRAME_INTERVAL_SEC) + 1)]
    raw_timestamps = [t for t in raw_timestamps if t < duration_sec]

    # If video is shorter than FRAME_INTERVAL_SEC, just grab a frame at 0s and end
    if not raw_timestamps:
        raw_timestamps = [0.0]

    # Evenly subsample down to max_frames
    if len(raw_timestamps) > max_frames:
        step = len(raw_timestamps) / max_frames
        raw_timestamps = [raw_timestamps[int(i * step)] for i in range(max_frames)]

    frame_urls: list[str] = []
    session_id = uuid.uuid4().hex[:8]

    for i, ts in enumerate(raw_timestamps):
        cap.set(cv2.CAP_PROP_POS_MSEC, ts * 1000)
        ret, frame = cap.read()
        if not ret:
            continue

        filename = f"frame_{session_id}_{i:02d}_{int(ts):04d}s.jpg"
        out_path = FRAMES_DIR / filename
        cv2.imwrite(str(out_path), frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        frame_urls.append(f"/static/frames/{filename}")

    cap.release()
    return frame_urls


def get_video_duration(video_url: str) -> float:
    """Returns video duration in seconds, or 0.0 on error."""
    local_path = video_url.lstrip("/")
    cap = cv2.VideoCapture(local_path)
    if not cap.isOpened():
        return 0.0
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    return frames / fps
