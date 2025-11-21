"""
Simple Telegram Bot for Shanails Salon

Handles /start command and provides WebApp button to launch booking interface.
"""
import os
import logging
from telegram import Update, WebAppInfo, KeyboardButton, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Get configuration from environment
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
WEBAPP_URL = os.getenv('MINI_APP_URL', 'http://localhost:5173')


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Handle /start command.
    Send welcome message. User can use the menu button to open the WebApp.
    """
    user = update.effective_user
    logger.info(f"User {user.id} ({user.first_name}) started the bot")
    
    # Send welcome message
    await update.message.reply_text(
        f"Вітаємо, {user.first_name}! 👋\n\n"
        f"Ласкаво просимо до Shanails Nail Studio!\n\n"
        f"Натисніть кнопку Menu (☰) внизу ліворуч, щоб записатися на процедуру."
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /help command."""
    await update.message.reply_text(
        "🔹 /start - Почати роботу з ботом\n"
        "🔹 /help - Показати це повідомлення\n\n"
        "Використовуйте кнопку 'Записатися' для бронювання процедур."
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
    application.add_handler(CommandHandler("help", help_command))
    
    # Start bot
    logger.info("Starting bot...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()
