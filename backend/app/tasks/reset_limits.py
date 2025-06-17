from datetime import datetime, timezone
import logging
from fastapi import logger
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.review import Review
from app.core.database import SessionLocal
from app.core.celery_app import celery_app
import app.models

logger = logging.getLogger(__name__)

@celery_app.task
def reset_video_limits():
    logger.info("🌀 Celery Beat triggered reset_video_limits task")
    db: Session = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            user.video_generation_count = 0
            user.last_video_reset = datetime.now(timezone.utc)
        db.commit()
        print("✅ Video generation counts reset at midnight.")
    except Exception as e:
        print(f"❌ Error resetting limits: {e}")
        db.rollback()
    finally:
        db.close()
