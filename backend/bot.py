"""
Simple Telegram Bot for Shanails Salon

Handles /start command and provides WebApp button to launch booking interface.
"""
import os
import logging
import asyncio
from datetime import datetime
from telegram import Update, WebAppInfo, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup, MenuButtonWebApp
from telegram.ext import Application, CommandHandler, ContextTypes
import jwt

# Import database and models
from src.database import SessionLocal
from src.models import User
from src.api.endpoints.auth import generate_jwt_token

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Get configuration from environment
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
WEBAPP_URL = os.getenv('WEBAPP_URL', 'http://localhost:5173')
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Handle /start command.
    If args contain 'login', generate a magic link.
    Otherwise, send welcome message with WebApp button.
    """
    user = update.effective_user
    logger.info(f"User {user.id} ({user.first_name}) started the bot with args: {context.args}")
    
    # Check for login argument
    if context.args and context.args[0] == 'login':
        await handle_login(update, context)
        return

    # Create keyboard with WebApp button
    keyboard = ReplyKeyboardMarkup.from_button(
        KeyboardButton(
            text="📅 Записатися",
            web_app=WebAppInfo(url=WEBAPP_URL)
        ),
        resize_keyboard=True
    )

    # Send welcome message
    await update.message.reply_text(
        f"Привіт, {user.first_name}! 👋\n\n"
        f"Я бот Shanails Studio.\n\n"
        f"📅 **Запис:** Тисни кнопку **Записатися** внизу.\n"
        f"🔐 **Вхід на сайт:** Введи команду /login",
        reply_markup=keyboard,
        parse_mode="Markdown"
    )


async def handle_login(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle login request from website."""
    telegram_user = update.effective_user
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Find or create user
        user = db.query(User).filter(User.telegram_id == telegram_user.id).first()
        
        if not user:
            logger.info(f"Creating new user for login: {telegram_user.id}")
            user = User(
                telegram_id=telegram_user.id,
                name=f"{telegram_user.first_name} {telegram_user.last_name or ''}".strip(),
                role="CLIENT",
                is_registered=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Generate JWT token
        token = generate_jwt_token(user)
        
        # Create magic link
        magic_link = f"{WEBAPP_URL}/auth/callback?token={token}"
        
        # Send link to user with both button and copyable text
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🔐 Увійти на сайт", url=magic_link)]
        ])
        
        await update.message.reply_text(
            f"Натисніть кнопку нижче для швидкого входу, або скопіюйте посилання для вставки у потрібний браузер:\n\n"
            f"🔗 `{magic_link}`\n\n"
            f"_Посилання дійсне 24 години_",
            reply_markup=keyboard,
            parse_mode="Markdown"
        )
        
    except Exception as e:
        logger.error(f"Error handling login: {e}")
        await update.message.reply_text("❌ Помилка входу. Спробуйте пізніше.")
    finally:
        db.close()


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /help command."""
    await update.message.reply_text(
        "🔹 /start - Головне меню\n"
        "🔹 /login - Вхід на сайт\n"
        "🔹 /help - Допомога"
    )


def main() -> None:
    """Start the bot."""
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set!")
        return
    
    # Create application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Register handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("login", handle_login))
    application.add_handler(CommandHandler("help", help_command))
    
    # Set menu button on startup
    async def post_init(app: Application) -> None:
        await app.bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(text="Записатися", web_app=WebAppInfo(url=WEBAPP_URL))
        )
    
    application.post_init = post_init
    
    # Start bot
    logger.info("Starting bot...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()
