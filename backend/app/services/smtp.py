import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger("smtp_service")

def send_verification_email(recipient_email: str, code: str) -> bool:
    """
    Sends a 6-digit verification code to recipient email via SMTP
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(f"[SIMULATED SMTP] Verification code for {recipient_email}: {code}")
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"BauSquad — Код подтверждения регистрации: {code}"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = recipient_email

    text_body = f"Ваш код для подтверждения регистрации в BauSquad: {code}\nКод действителен 15 минут."
    html_body = f"""
    <div style="font-family: Arial, sans-serif; background-color: #0f1418; color: #ecf0f1; padding: 30px; border-radius: 8px;">
      <h2 style="color: #c5a059; margin-top: 0;">BAUSQUAD — Подтверждение почты</h2>
      <p>Здравствуйте!</p>
      <p>Для завершения регистрации на инженерном портале BauSquad введите следующий 6-значный код:</p>
      <div style="background-color: #1a252f; border: 2px solid #c5a059; color: #f1c40f; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 15px; margin: 20px 0;">
        {code}
      </div>
      <p style="color: #bdc3c7; font-size: 13px;">Если вы не запрашивали регистрацию, просто проигнорируйте это письмо.</p>
    </div>
    """

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, [recipient_email], msg.as_string())
        server.quit()
        logger.info(f"Verification email sent to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        return False
