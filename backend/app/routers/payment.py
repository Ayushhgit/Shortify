from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.services.payment_service import PaymentService
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/payment",
    tags=["payment"]
)

# Pydantic models for request/response
class CreateOrderRequest(BaseModel):
    amount: int
    currency: str = "INR"

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_name: str
    amount: int

class SubscriptionStatusResponse(BaseModel):
    subscription_type: str
    is_active: bool
    subscription_end: Optional[str] = None
    subscription_start: Optional[str] = None
    payment_id: Optional[str] = None  
    video_generation_count: Optional[int] = 0  

payment_service = PaymentService()

@router.post("/create-order")
async def create_order(
    amount: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a payment order"""
    try:
        if amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount must be greater than 0"
            )
        
        order = payment_service.create_order(amount)
        return order
        
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment order"
        )

@router.post("/verify")
async def verify_payment(
    payment_data: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify payment and update user subscription"""
    try:
        # Verify payment signature
        is_valid = payment_service.verify_payment(
            payment_data.razorpay_order_id,
            payment_data.razorpay_payment_id,
            payment_data.razorpay_signature
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature"
            )
        
        # Update user subscription
        updated_user = payment_service.update_user_subscription(
            user_email=current_user.email,
            plan_name=payment_data.plan_name,
            payment_id=payment_data.razorpay_payment_id,
            db=db
        )
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "success": True,
            "message": f"Payment verified and subscription updated to {payment_data.plan_name}",
            "subscription_type": updated_user.subscription_type,
            "subscription_end": updated_user.subscription_end.isoformat() if updated_user.subscription_end else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment verification failed"
        )

@router.get("/subscription-status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscription status"""
    try:
        # Add error handling and logging for debugging
        logger.info(f"Getting subscription status for user: {current_user.email}")
        
        status_data = payment_service.get_user_subscription_status(
            user_email=current_user.email,
            db=db
        )
        
        logger.info(f"Subscription status retrieved: {status_data}")
        return status_data
        
    except Exception as e:
        logger.error(f"Error getting subscription status for user {current_user.email if current_user else 'Unknown'}: {str(e)}")
        # Return default status instead of raising exception for debugging
        return {
            "subscription_type": "free",
            "is_active": False,
            "subscription_end": None,
            "subscription_start": None,
            "payment_id": None,
            "video_generation_count": 0
        }

@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel user's current subscription"""
    try:
        # Find user and update subscription
        user = db.query(User).filter(User.email == current_user.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Set subscription to free and deactivate
        user.subscription_type = 'free'
        user.is_active = True  # Keep account active but downgrade plan
        user.subscription_end = None
        
        db.commit()
        
        return {
            "success": True,
            "message": "Subscription cancelled successfully. You've been moved to the free plan."
        }
        
    except Exception as e:
        logger.error(f"Error cancelling subscription: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )

# Add a debug endpoint to test without authentication
@router.get("/test-subscription")
async def test_subscription_status(
    email: str,
    db: Session = Depends(get_db)
):
    """Test endpoint to check subscription status without auth (remove in production)"""
    try:
        logger.info(f"Testing subscription status for email: {email}")
        
        status_data = payment_service.get_user_subscription_status(
            user_email=email,
            db=db
        )
        
        return {
            "success": True,
            "data": status_data
        }
        
    except Exception as e:
        logger.error(f"Error in test endpoint: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "data": {
                "subscription_type": "free",
                "is_active": False,
                "subscription_end": None,
                "payment_id": None,
                "subscription_start": None
            }
        }