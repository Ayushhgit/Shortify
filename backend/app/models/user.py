from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.schemas import SubscriptionTypeEnum
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    firebase_uid = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    subscription_type = Column(
    Enum(SubscriptionTypeEnum, name="subscription_type"),
    default=SubscriptionTypeEnum.free,
    server_default=SubscriptionTypeEnum.free.value,
    nullable=False)
    video_generation_count = Column(Integer, default=0)
    last_video_reset = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"User(id={self.id}, email={self.email}, subscription={self.subscription_type})"