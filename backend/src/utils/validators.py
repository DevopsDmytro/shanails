"""
Validators for user input
"""
import re
from typing import Optional, Tuple


def validate_ukrainian_phone(phone: str) -> Tuple[bool, Optional[str]]:
    """
    Validates and normalizes Ukrainian phone number
    
    Accepts formats:
    - +380XXXXXXXXX
    - 380XXXXXXXXX
    - 0XXXXXXXXX
    - +380 XX XXX XXXX (with spaces)
    
    Returns:
        Tuple[bool, Optional[str]]: (is_valid, normalized_phone)
        normalized_phone is in format +380XXXXXXXXX
    """
    if not phone:
        return False, None
    
    # Remove all spaces, dashes, and parentheses
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    
    # Remove leading '+' if present
    if cleaned.startswith('+'):
        cleaned = cleaned[1:]
    
    # Handle different formats
    if cleaned.startswith('380'):
        # Format: 380XXXXXXXXX
        if len(cleaned) == 12 and cleaned.isdigit():
            return True, f'+{cleaned}'
    elif cleaned.startswith('0'):
        # Format: 0XXXXXXXXX -> convert to 380XXXXXXXXX
        if len(cleaned) == 10 and cleaned.isdigit():
            return True, f'+38{cleaned}'
    
    return False, None


def validate_name(name: str) -> Tuple[bool, Optional[str]]:
    """
    Validates user name
    
    Rules:
    - Minimum 2 characters
    - Maximum 50 characters
    - Only letters, spaces, hyphens, and apostrophes
    - Trim whitespace
    
    Returns:
        Tuple[bool, Optional[str]]: (is_valid, cleaned_name)
    """
    if not name:
        return False, None
    
    # Trim whitespace
    cleaned = name.strip()
    
    # Check length
    if len(cleaned) < 2 or len(cleaned) > 50:
        return False, None
    
    # Check characters (allow letters from any language, spaces, hyphens, apostrophes)
    # This regex allows Unicode letters
    if not re.match(r"^[\w\s\-']+$", cleaned, re.UNICODE):
        return False, None
    
    return True, cleaned


def format_phone_for_display(phone: str) -> str:
    """
    Format phone number for display
    
    Input: +380XXXXXXXXX
    Output: +380 XX XXX XXXX
    """
    if not phone or len(phone) != 13:
        return phone
    
    # +380 XX XXX XXXX
    return f'{phone[:4]} {phone[4:6]} {phone[6:9]} {phone[9:]}'
