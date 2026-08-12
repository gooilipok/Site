import httpx
import logging
from app.core.config import settings

logger = logging.getLogger("telegram_service")

async def send_telegram_order_notification(order_data: dict) -> bool:
    """
    Sends a formatted Telegram message to admin chat via Telegram Bot API
    """
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_ADMIN_CHAT_ID:
        logger.warning("Telegram Bot Token or Admin Chat ID not configured.")
        return False

    title = order_data.get("title", "")
    description = order_data.get("description", "")
    deadline = order_data.get("deadline", "Не указан")
    price = order_data.get("price", "По договоренности")
    contact = order_data.get("contact", "")
    author = f"@{order_data.get('user_username', '')} ({order_data.get('user_email', '')})"
    date_str = order_data.get("created_at", "")
    files_count = len(order_data.get("files", []))

    text = (
        f"📚 <b>Новый заказ #{order_data.get('id', '')}</b>\n\n"
        f"<b>Предмет:</b> {title}\n"
        f"<b>Описание:</b> {description}\n"
        f"<b>Дедлайн:</b> {deadline}\n"
        f"<b>Цена:</b> {price}\n"
        f"<b>Контакт:</b> {contact}\n"
        f"<b>Автор:</b> {author}\n"
        f"<b>Дата:</b> {date_str}\n"
        f"<b>Файлы:</b> {files_count} шт."
    )

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": settings.TELEGRAM_ADMIN_CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": [
                [
                    {"text": "✅ Принять заказ", "callback_data": f"accept_{order_data.get('id')}"},
                    {"text": "❌ Отклонить", "callback_data": f"decline_{order_data.get('id')}"}
                ]
            ]
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=10.0)
            if resp.status_code == 200:
                logger.info(f"Telegram notification sent for order {order_data.get('id')}")
                return True
            else:
                logger.error(f"Telegram API error: {resp.text}")
                return False
    except Exception as e:
        logger.error(f"Failed to send Telegram message: {str(e)}")
        return False
