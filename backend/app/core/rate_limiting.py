from enum import Enum
from typing import Dict, Optional
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.database import get_db
from app.core.security import get_current_user

class FeatureType(str, Enum):
    VIDEO_GENERATION = "video_generation"
    PDF_SUMMARIZATION = "pdf_summarization"
    YT_SUMMARIZATION = "yt_summarization"
    ARTICLE_SUMMARIZATION = "article_summarization"
    RESUME_ANALYSIS = "resume_analysis"
    COVER_LETTER_GENERATION = "cover_letter_generation"
    ASSIGNMENT_HELP = "assignment_help"
    RESEARCH_ASSISTANCE = "research_assistance"
    DATA_ANALYSIS = "data_analysis"
    LINKEDIN_HELP = "linkedin_help"
    QUIZ_GENERATION = "quiz_generation"
    CLIP_GENERATION = "clip_generation"
    INTERVIEW_PREP = "interview_prep"

# Define limits for each subscription type and feature
SUBSCRIPTION_LIMITS: Dict[str, Dict[FeatureType, int]] = {
    "free": {
        FeatureType.VIDEO_GENERATION: 2,
        FeatureType.PDF_SUMMARIZATION: 2,
        FeatureType.YT_SUMMARIZATION: 1,
        FeatureType.ARTICLE_SUMMARIZATION: 2,
        FeatureType.RESUME_ANALYSIS: 2,
        FeatureType.COVER_LETTER_GENERATION: 2,
        FeatureType.ASSIGNMENT_HELP: 1,
        FeatureType.RESEARCH_ASSISTANCE: 2,
        FeatureType.DATA_ANALYSIS: 1,
        FeatureType.LINKEDIN_HELP: 2,
        FeatureType.QUIZ_GENERATION: 2,
        FeatureType.CLIP_GENERATION: 2,
        FeatureType.INTERVIEW_PREP: 2,
    },
    "pro": {
        FeatureType.VIDEO_GENERATION: 5,
        FeatureType.PDF_SUMMARIZATION: 10,
        FeatureType.YT_SUMMARIZATION: 8,
        FeatureType.ARTICLE_SUMMARIZATION: 12,
        FeatureType.RESUME_ANALYSIS: 8,
        FeatureType.COVER_LETTER_GENERATION: 8,
        FeatureType.ASSIGNMENT_HELP: 5,
        FeatureType.RESEARCH_ASSISTANCE: 8,
        FeatureType.DATA_ANALYSIS: 5,
        FeatureType.LINKEDIN_HELP: 10,
        FeatureType.QUIZ_GENERATION: 12,
        FeatureType.CLIP_GENERATION: 10,
        FeatureType.INTERVIEW_PREP: 10,

    },
    "premium": {
        FeatureType.VIDEO_GENERATION: 10,
        FeatureType.PDF_SUMMARIZATION: 25,
        FeatureType.YT_SUMMARIZATION: 30,
        FeatureType.ARTICLE_SUMMARIZATION: 30,
        FeatureType.RESUME_ANALYSIS: 20,
        FeatureType.COVER_LETTER_GENERATION: 20,
        FeatureType.ASSIGNMENT_HELP: 15,
        FeatureType.RESEARCH_ASSISTANCE: 15,
        FeatureType.DATA_ANALYSIS: 15,
        FeatureType.LINKEDIN_HELP: 25,
        FeatureType.QUIZ_GENERATION: 25,
        FeatureType.CLIP_GENERATION: 25,
        FeatureType.INTERVIEW_PREP: 25,
    }
}

class RateLimitChecker:
    def __init__(self, feature_type: FeatureType):
        self.feature_type = feature_type
    
    def check_and_increment(
        self, 
        user: User, 
        db: Session, 
        increment: bool = True
    ) -> Dict[str, any]:
        """
        Check if user has reached their limit for the feature and optionally increment count
        
        Returns:
            Dict with 'allowed' (bool), 'remaining' (int), 'limit' (int), 'subscription' (str)
        """
        subscription = (user.subscription_type or "free").lower()
        limits = SUBSCRIPTION_LIMITS.get(subscription, SUBSCRIPTION_LIMITS["free"])
        limit = limits.get(self.feature_type, 0)
        
        # Get current usage count for this feature
        current_count = getattr(user, f"{self.feature_type.value}_count", 0) or 0
        
        if current_count >= limit:
            return {
                'allowed': False,
                'remaining': 0,
                'limit': limit,
                'subscription': subscription,
                'current_count': current_count
            }
        
        # Increment count if requested
        if increment:
            setattr(user, f"{self.feature_type.value}_count", current_count + 1)
            db.commit()
            current_count += 1
        
        return {
            'allowed': True,
            'remaining': limit - current_count,
            'limit': limit,
            'subscription': subscription,
            'current_count': current_count
        }

def create_rate_limit_dependency(feature_type: FeatureType):
    """
    Factory function to create rate limiting dependency for specific features
    """
    def rate_limit_check(
        current_user: Optional[dict] = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Fetch user record from DB
        user = db.query(User).filter(User.firebase_uid == current_user["uid"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check rate limit
        checker = RateLimitChecker(feature_type)
        result = checker.check_and_increment(user, db, increment=True)
        
        if not result['allowed']:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded for {feature_type.value}. "
                       f"Limit: {result['limit']} per day for {result['subscription']} users. "
                       f"Upgrade your subscription for higher limits."
            )
        
        return {
            'user': user,
            'rate_limit_info': result
        }
    
    return rate_limit_check

yt_summarization_rate_limit = create_rate_limit_dependency(FeatureType.YT_SUMMARIZATION)
video_generation_rate_limit = create_rate_limit_dependency(FeatureType.VIDEO_GENERATION)
article_summarization_rate_limit = create_rate_limit_dependency(FeatureType.ARTICLE_SUMMARIZATION)
pdf_summarization_rate_limit = create_rate_limit_dependency(FeatureType.PDF_SUMMARIZATION)
resume_analysis_rate_limit = create_rate_limit_dependency(FeatureType.RESUME_ANALYSIS)
cover_letter_generation_rate_limit = create_rate_limit_dependency(FeatureType.COVER_LETTER_GENERATION)
assignment_help_rate_limit = create_rate_limit_dependency(FeatureType.ASSIGNMENT_HELP)
research_assistance_rate_limit = create_rate_limit_dependency(FeatureType.RESEARCH_ASSISTANCE)
data_analysis_rate_limit = create_rate_limit_dependency(FeatureType.DATA_ANALYSIS)
linkedin_help_rate_limit = create_rate_limit_dependency(FeatureType.LINKEDIN_HELP)
quiz_generation_rate_limit = create_rate_limit_dependency(FeatureType.QUIZ_GENERATION)
clip_generation_rate_limit = create_rate_limit_dependency(FeatureType.CLIP_GENERATION)
interview_prep_rate_limit = create_rate_limit_dependency(FeatureType.INTERVIEW_PREP)