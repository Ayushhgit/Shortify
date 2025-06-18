from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.schemas import SubscriptionTypeEnum
from datetime import datetime, timezone

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    firebase_uid = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    subscription_type = Column(
        Enum(SubscriptionTypeEnum, name="subscription_type"),
        default=SubscriptionTypeEnum.free,
        server_default=SubscriptionTypeEnum.free.value,
        nullable=False
    )
    
    # Existing video generation counter
    video_generation_count = Column(Integer, default=0)
    last_video_reset = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # New feature usage counters
    pdf_summarization_count = Column(Integer, default=0)
    yt_summarization_count = Column(Integer, default=0)
    article_summarization_count = Column(Integer, default=0)
    resume_analysis_count = Column(Integer, default=0)
    cover_letter_generation_count = Column(Integer, default=0)
    assignment_help_count = Column(Integer, default=0)
    research_assistance_count = Column(Integer, default=0)
    data_analysis_count = Column(Integer, default=0)
    linkedin_help_count = Column(Integer, default=0)
    
    # Subscription fields
    subscription_start = Column(DateTime(timezone=True), nullable=True)
    subscription_end = Column(DateTime(timezone=True), nullable=True)
    payment_id = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"User(id={self.id}, email={self.email}, subscription={self.subscription_type})"