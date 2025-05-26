from datetime import datetime
from sqlalchemy.orm import Session
from app.models import user
from app.core.database import SessionLocal
from app.core.celery_app import celery_app

@celery_app.task
def reset_video_limits():
    db: Session = SessionLocal()
    try:
        users = db.query(user).all()
        for user in users:
            user.video_generation_count = 0
            user.last_video_reset = datetime.utcnow()
        db.commit()
        print("✅ Video generation counts reset at midnight.")
    except Exception as e:
        print(f"❌ Error resetting limits: {e}")
        db.rollback()
    finally:
        db.close()
