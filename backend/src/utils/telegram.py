"""
Telegram WebApp utilities for validation and authentication
"""
import hashlib
import hmac
import json
from urllib.parse import parse_qs
from typing import Optional, Dict, Any
import os


def validate_telegram_web_app_data(init_data: str, bot_token: Optional[str] = None) -> tuple[bool, Optional[Dict[str, Any]]]:
    """
    Validate Telegram WebApp initData
    
    Args:
        init_data: The initData string from Telegram WebApp
        bot_token: Bot token (defaults to env var TELEGRAM_BOT_TOKEN)
    
    Returns:
        Tuple[bool, Optional[Dict]]: (is_valid, user_data)
    """
    if not bot_token:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    
    if not bot_token:
        return False, None
    
    try:
        # Parse the init_data
        parsed = parse_qs(init_data)
        
        # Extract hash
        if 'hash' not in parsed:
            return False, None
        
        received_hash = parsed['hash'][0]
        
        # Create data-check-string (all params except hash, sorted alphabetically)
        data_check_arr = []
        for key in sorted(parsed.keys()):
            if key != 'hash':
                value = parsed[key][0]
                data_check_arr.append(f'{key}={value}')
        
        data_check_string = '\n'.join(data_check_arr)
        
        # Calculate the secret key
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=bot_token.encode(),
            digestmod=hashlib.sha256
        ).digest()
        
        # Calculate the hash
        calculated_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        # Compare hashes
        if calculated_hash != received_hash:
            return False, None
        
        # Extract user data
        if 'user' not in parsed:
            return False, None
        
        user_data = json.loads(parsed['user'][0])
        
        return True, user_data
        
    except Exception as e:
        print(f"Error validating Telegram data: {e}")
        return False, None


def extract_telegram_user_data(init_data: str) -> Optional[Dict[str, Any]]:
    """
    Extract user data from Telegram WebApp initData without full validation
    Useful for development/testing
    
    Args:
        init_data: The initData string from Telegram WebApp
    
    Returns:
        Optional[Dict]: User data if found, None otherwise
    """
    try:
        parsed = parse_qs(init_data)
        if 'user' in parsed:
            return json.loads(parsed['user'][0])
        return None
    except Exception:
        return None
