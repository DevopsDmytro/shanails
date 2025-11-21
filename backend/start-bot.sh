#!/bin/bash
# Start Telegram Bot

export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
export WEBAPP_URL="${WEBAPP_URL:-http://localhost:5173}"

echo "Starting Telegram Bot..."
echo "WebApp URL: $WEBAPP_URL"

cd /app
python bot.py
