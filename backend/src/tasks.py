"""
Background Tasks

Scheduled tasks for system maintenance.
"""
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from .database import get_session
from .models import User

logger = logging.getLogger(__name__)


def reset_yearly_cancellations(session: Session):
    """
    Reset yearly cancellation counters for all users.
    Should be run daily (e.g., via cron job).
    """
    # Get start of current year
    current_year = datetime.now().year
    start_of_current_year = datetime(current_year, 1, 1)
    
    # Find users who haven't been reset this year
    users = session.query(User).filter(
        (User.last_cancellation_reset < start_of_current_year) |
        (User.last_cancellation_reset == None)
    ).all()
    
    reset_count = 0
    for user in users:
        user.cancellations_this_year = 0
        user.last_cancellation_reset = datetime.now()
        reset_count += 1
    
    session.commit()
    
    logger.info(f"Reset cancellation counters for {reset_count} users")
    return reset_count


if __name__ == "__main__":
    # Can be run as a script
    session = next(get_session())
    try:
        count = reset_yearly_cancellations(session)
        print(f"Successfully reset {count} users")
    finally:
        session.close()
