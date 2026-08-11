import secrets
from urllib.parse import quote

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from config import get_settings


def generate_magic_token() -> str:
    return secrets.token_urlsafe(32)


async def send_magic_link(email: str, token: str, frontend_url: str, flow: str = "new"):
    settings = get_settings()
    sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
    magic_link = f"{frontend_url}/auth/magic?token={quote(token)}&email={quote(email)}&flow={flow}"
    subject = "Your CareerBloom sign-in link" if flow == "returning" else "Welcome to CareerBloom"
    heading = "Welcome back" if flow == "returning" else "Your CareerBloom sign-up link"
    message = Mail(
        from_email="verdandi.labs@gmail.com",
        to_emails=email,
        subject=subject,
        html_content=f"""
        <h2>{heading}</h2>
        <p>Click the link below to sign in:</p>
        <p><a href="{magic_link}" style="background: #5ECFB8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Sign In</a></p>
        <p>Link expires in 15 minutes</p>
        <p>If you didn't request this, ignore this email.</p>
        """,
    )
    sg.send(message)
