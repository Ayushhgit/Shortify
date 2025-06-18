from datetime import datetime, timezone
import logging
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.database import SessionLocal
from app.core.celery_app import celery_app
from app.core.rate_limiting import FeatureType

logger = logging.getLogger(__name__)

@celery_app.task
def reset_all_limits():
    """Reset all feature usage counts for all users"""
    logger.info("🌀 Celery Beat triggered reset_all_limits task")
    db: Session = SessionLocal()
    try:
        users = db.query(User).all()
        
        # Reset all counters
        for user in users:
            # Reset video generation count (existing)
            user.video_generation_count = 0
            
            # Reset all other feature counts
            for feature in FeatureType:
                counter_field = f"{feature.value}_count"
                if hasattr(user, counter_field):
                    setattr(user, counter_field, 0)
            
            user.last_video_reset = datetime.now(timezone.utc)
        
        db.commit()
        logger.info("✅ All feature usage counts reset successfully.")
        
    except Exception as e:
        logger.error(f"❌ Error resetting limits: {e}")
        db.rollback()
        raise
    finally:
        db.close()