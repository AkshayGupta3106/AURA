from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str   # "creator" | "customer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    name: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


# ── Transformation ─────────────────────────────────────────────────────────────

class TransformationOut(BaseModel):
    id: int
    salon_id: int
    artist_name: str
    service_type: str
    hair_texture_tag: Optional[str]
    before_image_url: str
    after_image_url: str
    style_description: Optional[str]
    try_on_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Video ──────────────────────────────────────────────────────────────────────

class VideoOut(BaseModel):
    id: int
    salon_id: int
    creator_id: int
    video_url: str
    title: str
    status: str
    virality_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True
