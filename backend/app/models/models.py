from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "creator" | "customer"

    salons = relationship("Salon", back_populates="owner")
    bookings = relationship("Booking", back_populates="customer")
    videos = relationship("Video", back_populates="creator")


class Salon(Base):
    __tablename__ = "salons"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    neighborhood = Column(String)
    description = Column(Text)

    owner = relationship("User", back_populates="salons")
    transformations = relationship("Transformation", back_populates="salon")
    videos = relationship("Video", back_populates="salon")
    bookings = relationship("Booking", back_populates="salon")


class Transformation(Base):
    __tablename__ = "transformations"

    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("salons.id"), nullable=False)
    artist_name = Column(String, nullable=False)
    service_type = Column(String, nullable=False)       # e.g. "balayage", "keratin"
    hair_texture_tag = Column(String)                   # e.g. "curly", "wavy"
    before_image_url = Column(String, nullable=False)
    after_image_url = Column(String, nullable=False)
    style_description = Column(Text)                    # filled by Gemini on Day 2
    try_on_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    salon = relationship("Salon", back_populates="transformations")
    bookings = relationship("Booking", back_populates="transformation")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("salons.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    video_url = Column(String, nullable=False)
    title = Column(String, nullable=False)
    status = Column(String, default="pending")   # pending | simulating | done | published
    virality_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    salon = relationship("Salon", back_populates="videos")
    creator = relationship("User", back_populates="videos")
    simulation_results = relationship("SimulationResult", back_populates="video", cascade="all, delete-orphan")


class SimulationResult(Base):
    __tablename__ = "simulation_results"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    persona_name = Column(String, nullable=False)
    persona_profile = Column(Text)
    watch_through = Column(Float)    # 0-100
    liked = Column(Boolean)
    shared = Column(Boolean)
    skipped_at = Column(Float, nullable=True)   # seconds or null
    comment = Column(Text, nullable=True)

    video = relationship("Video", back_populates="simulation_results")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transformation_id = Column(Integer, ForeignKey("transformations.id"), nullable=False)
    salon_id = Column(Integer, ForeignKey("salons.id"), nullable=False)
    status = Column(String, default="confirmed")
    booked_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("User", back_populates="bookings")
    transformation = relationship("Transformation", back_populates="bookings")
    salon = relationship("Salon", back_populates="bookings")
