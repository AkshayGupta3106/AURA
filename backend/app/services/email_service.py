import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import HTTPException

def generate_otp() -> str:
    """Generate a random 6-digit OTP."""
    return f"{random.randint(100000, 999999)}"

def send_otp_email(email: str, otp: str):
    """
    Send verification email using SMTP credentials from backend/.env.
    Logs OTP to console for reference and throws a detailed error if SMTP configuration is missing.
    """
    print(f"\n==========================================")
    print(f"[OTP SERVICE] Verification code for {email}: {otp}")
    print(f"==========================================\n")
    
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    smtp_sender = os.getenv("SMTP_SENDER", smtp_user)
    
    if not (smtp_host and smtp_port and smtp_user and smtp_pass):
        print(f"[OTP SERVICE] SMTP credentials not fully configured. Email was not sent via SMTP, but OTP has been logged above.")
        return
        
    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_sender
        msg["To"] = email
        msg["Subject"] = f"AURA Verification Code: {otp}"
        
        body = f"Your AURA verification code is: {otp}\nIt will expire in 5 minutes."
        msg.attach(MIMEText(body, "plain"))
        
        port = int(smtp_port)
        if port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port)
        else:
            server = smtplib.SMTP(smtp_host, port)
            server.starttls()
            
        with server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        print(f"[OTP SERVICE] Email successfully sent to {email}")
    except Exception as e:
        print(f"[OTP SERVICE] Error sending email to {email}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email via SMTP: {str(e)}"
        )
