#!/bin/bash

# Default to the user's ID if not provided
DEFAULT_ID=1656854173

if [ -z "$1" ]; then
  echo "Usage: ./delete_user.sh <telegram_id>"
  echo "Using default ID: $DEFAULT_ID"
  ID=$DEFAULT_ID
else
  ID=$1
fi

echo "Deleting user with Telegram ID: $ID"
./backend/venv/bin/python3 backend/delete_user.py --telegram-id $ID
