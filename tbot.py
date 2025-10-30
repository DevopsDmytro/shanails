# -*- coding: utf-8 -*-

import logging
import re
import httpx
import json
import os
from datetime import datetime, timedelta

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, TelegramError
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ConversationHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

# --- Get settings from environment variables ---
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "YOUR_TELEGRAM_TOKEN")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "YOUR_N8N_WEBHOOK_URL")

# Check if tokens are set
if TELEGRAM_TOKEN == "YOUR_TELEGRAM_TOKEN" or N8N_WEBHOOK_URL == "YOUR_N8N_WEBHOOK_URL":
    # Using print because logger might not be configured yet
    print("WARNING: TELEGRAM_TOKEN or N8N_WEBHOOK_URL are not set in environment variables!")

# --- BASIC SETUP ---
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)
logging.getLogger("httpx").setLevel(logging.WARNING)


# --- STATE DEFINITIONS FOR CONVERSATIONHANDLER ---
# Main menu state
SELECTING_ACTION = 0
# States for booking conversation
(
    GETTING_NAME,
    GETTING_PHONE,
    SELECTING_MASTER,
    SELECTING_SERVICE_CAT,
    SELECTING_SERVICE,
    SELECTING_DATE,
    SELECTING_TIME,
) = range(1, 8)
# States for viewing services conversation (solves task 4)
VIEWING_SERVICE_LIST = 8


# --- DATA STORAGE ---
services = {
    "💅 Манікюр": [
        {"name": "Комплекс (зняття, манікюр, покриття)", "price": 800, "duration": 120},
        {"name": "Комплекс + Френч", "price": 900, "duration": 150},
        {"name": "Манікюр + Гель-Лак", "price": 750, "duration": 90},
        {"name": "Манікюр Комбінований", "price": 400, "duration": 60},
        {"name": "Чоловічий манікюр", "price": 450, "duration": 60},
        {"name": "Покриття гель-лаком", "price": 450, "duration": 40},
        {"name": "Френч дизайн", "price": 100, "duration": 30},
        {"name": "Укріплення гель-лаку", "price": 100, "duration": 10},
        {"name": "Зняття гель-лаку", "price": 100, "duration": 10},
        {"name": "Ремонт одного нігтя", "price": 70, "duration": 15},
        {"name": "Дизайн одного нігтя", "price": 25, "duration": 15},
        {"name": "Дизайн Втирка", "price": 200, "duration": 10},
    ],
    "💪 Нарощення": [
        {"name": "Нарощення 1 довжина", "price": 950, "duration": 180},
        {"name": "Нарощення 2 довжина", "price": 1000, "duration": 180},
        {"name": "Нарощення 3 довжина", "price": 1100, "duration": 180},
        {"name": "Нарощення 4 довжина", "price": 1200, "duration": 180},
        {"name": "Нарощення 5 довжина", "price": 1300, "duration": 180},
        {"name": "Корекція нарощених", "price": 950, "duration": 120},
        {"name": "Зняття нарощених нігтів", "price": 150, "duration": 20},
    ],
    "👣 Педикюр": [
        {"name": "Педикюр комплекс", "price": 850, "duration": 150},
        {"name": "Пальчики + покриття", "price": 750, "duration": 60},
        {"name": "Пальчики без покриття", "price": 500, "duration": 40},
        {"name": "Стопа + пальчики без покриття", "price": 650, "duration": 50},
        {"name": "Складні нігті", "price": 200, "duration": 0},
        {"name": "Зняття", "price": 150, "duration": 10},
        {"name": "Покриття звичайний лак", "price": 100, "duration": 30},
    ],
}
service_categories = list(services.keys())
masters = ["Анна", "Віка", "Женя", "Ілона"]

# --- HELPER FUNCTIONS ---

async def send_n8n_request(data):
    """Asynchronous function to send requests to the n8n webhook."""
    logger.info(f"Sending to n8n: {json.dumps(data, indent=2, ensure_ascii=False)}")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(N8N_WEBHOOK_URL, json=data, timeout=30)
            response.raise_for_status()
            if response.text:
                return response.json()
            return {}
    except (httpx.HTTPStatusError, httpx.RequestError, json.JSONDecodeError) as e:
        logger.error(f"Error communicating with n8n: {e}")
        return None

def format_phone_number(phone):
    """Formats a phone number to the 380XXXXXXXXX standard."""
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10 and digits.startswith("0"): return "38" + digits
    if len(digits) == 12 and digits.startswith("380"): return digits
    if len(digits) == 9: return "380" + digits
    return None
    
# NEW: Helper function to calculate total price (Task 2)
def _calculate_total_price(context: ContextTypes.DEFAULT_TYPE) -> int:
    """Calculates total price from selected services."""
    total_price = 0
    if 'selected_services' in context.user_data:
        for service in context.user_data['selected_services']:
            total_price += service.get('price', 0)
    return total_price

async def _display_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str):
    """Helper to display the main menu, editing if possible, otherwise sending new."""
    keyboard = [
        [InlineKeyboardButton("💅 Послуги та ціни", callback_data="view_services")],
        [InlineKeyboardButton("📞 Контакти", callback_data="contacts")],
        [InlineKeyboardButton("🗓️ Записатися", callback_data="book_appointment")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    if update.callback_query:
        try:
            await update.callback_query.edit_message_text(text, reply_markup=reply_markup)
        except TelegramError as e:
            logger.warning(f"Could not edit message, sending new: {e}")
            await update.effective_message.reply_text(text, reply_markup=reply_markup)
    else:
        await update.message.reply_text(text, reply_markup=reply_markup)


# --- MAIN MENU & GENERAL HANDLERS ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Sends a welcome message and displays the main menu."""
    user = update.effective_user
    logger.info(f"User {user.id} ({user.first_name}) started the bot.")
    context.user_data.clear() # Clear any previous state
    await _display_main_menu(update, context, "👋 Вітаємо у нашому салоні манікюру! Чим можемо допомогти?")
    return SELECTING_ACTION

async def show_contacts(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Displays contact information."""
    query = update.callback_query
    await query.answer()
    
    keyboard = [
        [InlineKeyboardButton("📍 Google Maps", url="https://share.google/XSiu7C2dP15OXIzWD")],
        [InlineKeyboardButton("📸 Instagram", url="https://instagram.com/shapovalova.nails_/")],
        # MODIFIED: Task 5 - Changed to a direct call URL
        [InlineKeyboardButton("📱 Зателефонувати", url="tel:+380636720373")],
        [InlineKeyboardButton("⬅️ Назад до меню", callback_data="main_menu")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(
        "<b>📞 Наші контакти:</b>\n\n"
        "📍 Адреса: [Ваша адреса тут]\n"
        "🕒 Години роботи: 10:00 - 20:00\n",
        reply_markup=reply_markup, parse_mode="HTML"
    )
    return SELECTING_ACTION

async def back_to_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Returns the user to the main menu from any conversation."""
    query = update.callback_query
    await query.answer()
    context.user_data.clear()
    await _display_main_menu(update, context, "Чим ще можемо допомогти?")
    return ConversationHandler.END # End any active conversation

# --- VIEW SERVICES CONVERSATION (TASK 4) ---

async def view_service_categories(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Displays service categories for viewing."""
    query = update.callback_query
    await query.answer()
    keyboard = [
        [InlineKeyboardButton(name, callback_data=f"view_cat_{idx}")]
        for idx, name in enumerate(service_categories)
    ]
    keyboard.append([InlineKeyboardButton("⬅️ Назад до меню", callback_data="main_menu")])
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(
        "Оберіть категорію, щоб переглянути послуги та ціни:",
        reply_markup=reply_markup
    )
    return VIEWING_SERVICE_LIST

async def view_service_list(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Displays services within a selected category."""
    query = update.callback_query
    await query.answer()
    cat_idx = int(query.data.split("_")[-1])
    category_name = service_categories[cat_idx]

    text = f"<b>{category_name}</b>\n\n"
    for s in services[category_name]:
        duration = f" ({s['duration']} хв.)" if s.get('duration') else ""
        text += f"• {s['name']}: <b>{s['price']} грн.</b>{duration}\n"
    
    keyboard = [
        [InlineKeyboardButton("⬅️ Назад до категорій", callback_data="view_services")],
        [InlineKeyboardButton("⬅️ Назад до меню", callback_data="main_menu")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(text, parse_mode="HTML", reply_markup=reply_markup)
    return VIEWING_SERVICE_LIST


# --- BOOKING CONVERSATION ---

async def start_booking(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts booking: checks limits, then checks registration."""
    query = update.callback_query
    user_id = query.from_user.id
    await query.answer()
    context.user_data.clear() # Start fresh

    # NEW: Task 3 - Check for active booking limit
    await query.edit_message_text(text="Перевіряємо ваші активні записи...")
    
    # IMPORTANT: Your n8n must handle "check_active_bookings" and return this structure:
    # {"active_bookings_count": 2, "bookings_details": [{"master": ..., "date": ..., ...}]}
    limit_response = await send_n8n_request({"action": "check_active_bookings", "telegram_id": user_id})

    if limit_response and limit_response.get("active_bookings_count", 0) >= 2:
        logger.warning(f"User {user_id} has reached booking limit.")
        text = "<b>Ви вже маєте 2 або більше активних записів.</b>\n\n"
        details = limit_response.get("bookings_details", [])
        for i, booking in enumerate(details):
            services_str = ", ".join(booking.get("services", []))
            text += (
                f"<b>Запис {i+1}:</b>\n"
                f"•  <b>Майстер:</b> {booking.get('master', 'N/A')}\n"
                f"•  <b>Дата:</b> {booking.get('date', 'N/A')}\n"
                f"•  <b>Час:</b> {booking.get('time', 'N/A')}\n"
                f"•  <b>Послуга:</b> {services_str}\n"
                f"•  <b>Ціна:</b> {booking.get('price', 'N/A')} грн.\n\n"
            )
        await query.edit_message_text(text, parse_mode='HTML', reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ Назад до меню", callback_data="main_menu")]]))
        return ConversationHandler.END

    # If limit is not reached, proceed to registration check
    await query.edit_message_text(text="Перевіряємо вашу реєстрацію...")
    client_check = await send_n8n_request({"action": "check_client", "telegram_id": user_id})
    
    if client_check and client_check.get("exists"):
        context.user_data['client_info'] = client_check.get('client_data')
        return await ask_master(update, context, "Ви вже зареєстровані! Оберіть майстра:")
    elif client_check is not None:
        await query.edit_message_text("Ви у нас вперше! Будь ласка, введіть ваше ім'я:")
        return GETTING_NAME
    else:
        await query.edit_message_text("😥 Виникла помилка. Спробуйте пізніше.")
        return ConversationHandler.END

async def get_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Saves user name and asks for phone."""
    context.user_data['name'] = update.message.text
    await update.message.reply_text("Дякую! Тепер, будь ласка, надішліть ваш номер телефону (напр. 0991234567).")
    return GETTING_PHONE

async def get_phone(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Saves phone, registers client via n8n, and proceeds to master selection."""
    phone = update.message.text
    formatted_phone = format_phone_number(phone)
    if not formatted_phone:
        await update.message.reply_text("Неправильний формат номеру. Спробуйте ще раз.")
        return GETTING_PHONE

    await update.message.reply_text("Реєструємо вас...")
    payload = {
        "action": "register_client",
        "telegram_id": update.effective_user.id,
        "name": context.user_data['name'],
        "phone": formatted_phone,
    }
    response = await send_n8n_request(payload)

    if response and response.get("success"):
        context.user_data['client_info'] = response.get('client_data')
        # We need to send a new message here since we were replying to user's text
        await update.message.reply_text("Дякуємо за реєстрацію!")
        return await ask_master(update, context, "Тепер давайте оберемо майстра:")
    else:
        await update.message.reply_text("😥 Не вдалося вас зареєструвати. Спробуйте пізніше.")
        return ConversationHandler.END

async def ask_master(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str) -> int:
    """Displays master selection buttons."""
    keyboard = [[InlineKeyboardButton(m, callback_data=f"master_{m}")] for m in masters]
    reply_markup = InlineKeyboardMarkup(keyboard)

    if update.callback_query:
        await update.callback_query.edit_message_text(text, reply_markup=reply_markup)
    else:
        # This happens after registration
        await update.message.reply_text(text, reply_markup=reply_markup)
    return SELECTING_SERVICE_CAT

async def select_master(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Saves master and asks for service category."""
    query = update.callback_query
    await query.answer()
    context.user_data['master'] = query.data.split('_')[1]
    context.user_data['selected_services'] = [] # Initialize list for selected services
    
    keyboard = [
        [InlineKeyboardButton(name, callback_data=f"cat_{idx}")]
        for idx, name in enumerate(service_categories)
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text("Оберіть категорію послуг:", reply_markup=reply_markup)
    return SELECTING_SERVICE

async def select_service_category(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Displays services for the chosen category during booking."""
    query = update.callback_query
    await query.answer()
    cat_idx = int(query.data.split('_')[1])
    category_name = service_categories[cat_idx]

    keyboard = [
        [InlineKeyboardButton(f"{s['name']} ({s['price']} грн)", callback_data=f"srv_{cat_idx}_{srv_idx}")]
        for srv_idx, s in enumerate(services[category_name])
    ]
    keyboard.append([InlineKeyboardButton("⬅️ Назад до категорій", callback_data=f"master_{context.user_data['master']}")])
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(f"Оберіть послугу з категорії '{category_name}':", reply_markup=reply_markup)
    return SELECTING_SERVICE

async def select_service(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Adds a service to the user's selection and asks what to do next."""
    query = update.callback_query
    await query.answer()
    _, cat_idx_str, srv_idx_str = query.data.split('_')
    service_obj = services[service_categories[int(cat_idx_str)]][int(srv_idx_str)]

    # Add service if not already present
    if service_obj not in context.user_data['selected_services']:
        context.user_data['selected_services'].append(service_obj)

    service_names = " \n- ".join([s['name'] for s in context.user_data['selected_services']])
    total_price = _calculate_total_price(context)
    
    text = (
        f"<b>Ваш вибір:</b>\n- {service_names}\n\n"
        f"<b>Поточна сума: {total_price} грн.</b>\n\n"
        "Бажаєте додати ще послугу чи перейти до вибору дати?"
    )
    keyboard = [
        [InlineKeyboardButton("➕ Додати ще послугу", callback_data=f"master_{context.user_data['master']}")],
        [InlineKeyboardButton("🗓️ Вибрати дату", callback_data="choose_date")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(text, parse_mode="HTML", reply_markup=reply_markup)
    return SELECTING_DATE

async def ask_date(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Displays a calendar. This is the start of the message editing chain (Task 1)."""
    query = update.callback_query
    await query.answer()
    today = datetime.now()
    keyboard = []
    for i in range(30):
        date = today + timedelta(days=i)
        if i % 6 == 0: keyboard.append([])
        keyboard[-1].append(InlineKeyboardButton(date.strftime("%d.%m"), callback_data=f"date_{date.strftime('%Y-%m-%d')}"))
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text("Будь ласка, оберіть зручну дату:", reply_markup=reply_markup)
    return SELECTING_TIME

async def select_date(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Saves date, requests free slots, and EDITS the calendar message."""
    query = update.callback_query
    await query.answer()
    date_str = query.data.split('_')[1]
    context.user_data['date'] = date_str

    # FIX: Task 1 - Edit the same message
    await query.edit_message_text(f"Ви обрали {date_str}. Шукаємо вільні години...")
    
    response = await send_n8n_request({
        "action": "get_free_slots",
        "master": context.user_data['master'],
        "date": date_str,
    })

    if response and response.get("slots"):
        slots = sorted(response["slots"])
        keyboard = [[InlineKeyboardButton(s, callback_data=f"time_{s}")] for s in slots]
        reply_markup = InlineKeyboardMarkup(keyboard)
        # FIX: Task 1 - Edit the "searching" message to show time slots
        await query.edit_message_text("Ось вільні години. Оберіть зручний для вас час:", reply_markup=reply_markup)
        return SELECTING_TIME
    else:
        # Go back to date selection on the same message
        await query.message.reply_text("На жаль, на цю дату вільних годин немає. Спробуйте обрати іншу.")
        return await ask_date(update, context)

async def select_time(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Saves time, creates appointment, and shows final confirmation by editing."""
    query = update.callback_query
    await query.answer()
    context.user_data['time'] = query.data.split('_')[1]
    user_data = context.user_data
    
    # MODIFIED: Task 2 - Calculate final price
    total_price = _calculate_total_price(context)
    service_names = [s['name'] for s in user_data['selected_services']]

    # FIX: Task 1 - Edit the time selection message to a pre-confirmation
    await query.edit_message_text("Підтверджуємо ваш запис...", parse_mode="HTML")

    payload = {
        "action": "create_appointment",
        "telegram_id": query.from_user.id,
        "master": user_data['master'],
        "date": user_data['date'],
        "time": user_data['time'],
        "services": service_names,
        "price": total_price, # MODIFIED: Task 2
    }
    response = await send_n8n_request(payload)

    # FIX: Task 1 - Final message is an edit of the previous one
    if response and response.get("success"):
        final_text = (
            f"<b>🎉 Ваш запис успішно створено!</b>\n\n"
            f"<b>Майстер:</b> {user_data['master']}\n"
            f"<b>Дата:</b> {user_data['date']}\n"
            f"<b>Час:</b> {user_data['time']}\n"
            f"<b>Послуги:</b>\n- {', '.join(service_names)}\n"
            f"<b>Загальна вартість:</b> {total_price} грн.\n\n"
            "Чекаємо на вас! ✨"
        )
    else:
        final_text = "😥 На жаль, сталася помилка під час створення запису. Спробуйте, будь ласка, пізніше."

    # Edit the message one last time to show the final result
    await query.edit_message_text(text=final_text, parse_mode='HTML')
    
    # Send a new message with the main menu
    await _display_main_menu(update, context, "Чим ще можемо допомогти?")
    
    context.user_data.clear()
    return ConversationHandler.END


def main() -> None:
    """Run the bot."""
    application = Application.builder().token(TELEGRAM_TOKEN).build()

    # Conversation for VIEWING services (Task 4)
    view_services_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(view_service_categories, pattern="^view_services$")],
        states={
            VIEWING_SERVICE_LIST: [
                CallbackQueryHandler(view_service_list, pattern="^view_cat_"),
                CallbackQueryHandler(view_service_categories, pattern="^view_services$"), # Back to cats
            ],
        },
        fallbacks=[CallbackQueryHandler(back_to_main_menu, pattern="^main_menu$")],
        map_to_parent={ConversationHandler.END: SELECTING_ACTION},
    )
    
    # Conversation for BOOKING an appointment
    booking_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(start_booking, pattern="^book_appointment$")],
        states={
            GETTING_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_name)],
            GETTING_PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_phone)],
            SELECTING_SERVICE_CAT: [CallbackQueryHandler(select_master, pattern="^master_")],
            SELECTING_SERVICE: [
                CallbackQueryHandler(select_service, pattern="^srv_"),
                CallbackQueryHandler(select_service_category, pattern="^cat_"),
            ],
            SELECTING_DATE: [CallbackQueryHandler(ask_date, pattern="^choose_date$")],
            SELECTING_TIME: [
                CallbackQueryHandler(select_date, pattern="^date_"),
                CallbackQueryHandler(select_time, pattern="^time_"),
            ],
        },
        fallbacks=[CallbackQueryHandler(back_to_main_menu, pattern="^main_menu$")],
        map_to_parent={ConversationHandler.END: SELECTING_ACTION},
    )

    # Main handler to route between conversations and simple callbacks
    main_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            SELECTING_ACTION: [
                view_services_conv,
                booking_conv,
                CallbackQueryHandler(show_contacts, pattern="^contacts$"),
            ],
        },
        fallbacks=[CommandHandler("start", start)], # Allow /start to reset everything
    )

    application.add_handler(main_handler)
    application.run_polling()

if __name__ == "__main__":
    main()

