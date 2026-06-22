from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, OTPVerification
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse, OTPSendRequest
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.services.email_service import generate_otp, send_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/send-otp")
def send_otp(payload: OTPSendRequest, db: Session = Depends(get_db)):
    # Check if email already registered
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    otp_record = OTPVerification(
        email=payload.email,
        otp=otp,
        expires_at=expires_at
    )
    db.add(otp_record)
    db.commit()

    smtp_sent = send_otp_email(payload.email, otp)
    if smtp_sent:
        return {"message": "OTP sent successfully"}
    else:
        return {
            "message": "OTP sent successfully (Demo Mode)",
            "sandbox_otp": otp
        }


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if payload.role not in ("creator", "customer"):
        raise HTTPException(status_code=400, detail="role must be 'creator' or 'customer'")

    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=409, detail="Username already registered")

    user = User(
        name=payload.name,
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user_id=user.id, role=user.role, name=user.name)



@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user_id=user.id, role=user.role, name=user.name)


from app.services.auth_service import get_current_user
from pydantic import BaseModel

class AccountUpdate(BaseModel):
    name: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.patch("/me")
def update_account(
    payload: AccountUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.name = payload.name
    db.commit()
    db.refresh(user)
    return {"message": "Account updated successfully", "name": user.name}

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid current password")
    
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.delete("/me")
def delete_account(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models.models import Salon, Booking, Video, Transformation, SimulationResult
    
    # 1. Delete bookings made by this user as a customer
    db.query(Booking).filter(Booking.customer_id == user.id).delete()
    
    # 2. Delete salon and related portfolio details if creator
    salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
    if salon:
        # Get salon transformations
        transformations = db.query(Transformation).filter(Transformation.salon_id == salon.id).all()
        t_ids = [t.id for t in transformations]
        
        # Delete bookings linked to these transformations
        if t_ids:
            db.query(Booking).filter(Booking.transformation_id.in_(t_ids)).delete()
        
        # Delete portfolio transformations
        db.query(Transformation).filter(Transformation.salon_id == salon.id).delete()
        
        # Get videos
        videos = db.query(Video).filter(Video.salon_id == salon.id).all()
        v_ids = [v.id for v in videos]
        
        # Delete simulation results
        if v_ids:
            db.query(SimulationResult).filter(SimulationResult.video_id.in_(v_ids)).delete()
        
        # Delete videos
        db.query(Video).filter(Video.salon_id == salon.id).delete()
        
        # Delete salon
        db.delete(salon)
        
    # 3. Delete user
    db.delete(user)
    db.commit()
    return {"message": "Account deleted successfully"}
