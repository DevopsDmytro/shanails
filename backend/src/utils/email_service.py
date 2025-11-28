"""Email service for sending verification and notification emails"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional


# SMTP Configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER)
APP_URL = os.getenv("APP_URL", "http://localhost:5173")


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send an email via SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
    
    Returns:
        bool: True if sent successfully
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"WARNING: SMTP not configured. Would send email to {to_email}")
        print(f"Subject: {subject}")
        print(f"Content: {html_content}")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Attach HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {str(e)}")
        return False


def send_verification_email(to_email: str, verification_token: str, user_name: str) -> bool:
    """
    Send email verification email
    
    Args:
        to_email: User's email address
        verification_token: Verification token
        user_name: User's name
    
    Returns:
        bool: True if sent successfully
    """
    verification_url = f"{APP_URL}/verify-email?token={verification_token}"
    
    subject = "Verify your email - Shanails"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Shanails! 💅</h1>
            </div>
            <div class="content">
                <p>Hi {user_name},</p>
                <p>Thank you for registering with Shanails! Please verify your email address to complete your registration.</p>
                <p style="text-align: center;">
                    <a href="{verification_url}" class="button">Verify Email Address</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all;">
                    {verification_url}
                </p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2024 Shanails. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(to_email, subject, html_content)
