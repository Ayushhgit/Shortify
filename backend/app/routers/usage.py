from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.core.rate_limiting import SUBSCRIPTION_LIMITS, FeatureType

router = APIRouter()

@router.get("/usage")
async def get_usage_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current usage information for all features"""
    user = db.query(User).filter(User.firebase_uid == current_user["uid"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    subscription = (user.subscription_type or "free").lower()
    limits = SUBSCRIPTION_LIMITS.get(subscription, SUBSCRIPTION_LIMITS["free"])
    
    usage_info = {}
    for feature in FeatureType:
        counter_field = f"{feature.value}_count"
        current_count = getattr(user, counter_field, 0) or 0
        limit = limits.get(feature, 0)
        
        usage_info[feature.value] = {
            "used": current_count,
            "limit": limit,
            "remaining": max(0, limit - current_count),
            "percentage": (current_count / limit * 100) if limit > 0 else 0
        }
    
    return {
        "subscription_type": subscription,
        "usage": usage_info,
        "reset_time": "Every 24 hours"
    }