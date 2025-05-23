from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
from typing import Optional
import razorpay
from app.core.config import settings
from app.models.user import User
from app.core.database import get_db
import logging

logger = logging.getLogger(__name__)

class PaymentService:
    def __init__(self):
        self.razorpay_client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
    
    def create_order(self, amount: int, currency: str = "INR") -> dict:
        """Create a Razorpay order"""
        try:
            order_data = {
                'amount': amount * 100,  # Convert to paise
                'currency': currency,
                'payment_capture': 1
            }
            order = self.razorpay_client.order.create(data=order_data)
            return {
                'order_id': order['id'],
                'amount': order['amount'],
                'currency': order['currency']
            }
        except Exception as e:
            logger.error(f"Error creating Razorpay order: {str(e)}")
            raise
    
    def verify_payment(
        self, 
        razorpay_order_id: str, 
        razorpay_payment_id: str, 
        razorpay_signature: str
    ) -> bool:
        """Verify Razorpay payment signature"""
        try:
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }
            self.razorpay_client.utility.verify_payment_signature(params_dict)
            return True
        except Exception as e:
            logger.error(f"Payment verification failed: {str(e)}")
            return False
    
    def update_user_subscription(
        self, 
        user_email: str, 
        plan_name: str, 
        payment_id: str,
        db: Session
    ) -> Optional[User]:
        """Update user subscription in database"""
        try:
            # Find user by email
            user = db.query(User).filter(User.email == user_email).first()
            if not user:
                logger.error(f"User not found: {user_email}")
                return None
            
            # Calculate subscription end date based on plan
            subscription_end = None
            if plan_name.lower() in ['pro', 'premium']:
                subscription_end = datetime.utcnow() + timedelta(days=30)  # 30 days subscription
            
            # Update user subscription
            user.subscription_type = plan_name.lower()
            user.subscription_start = datetime.utcnow()
            user.subscription_end = subscription_end
            user.payment_id = payment_id
            user.is_active = True
            
            db.commit()
            db.refresh(user)
            
            logger.info(f"Updated subscription for user {user_email} to {plan_name}")
            return user
            
        except Exception as e:
            logger.error(f"Error updating user subscription: {str(e)}")
            db.rollback()
            raise
    
    def get_user_subscription_status(self, user_email: str, db: Session) -> dict:
        """Get current subscription status for user"""
        try:
            user = db.query(User).filter(User.email == user_email).first()
            if not user:
                return {
                    'subscription_type': 'free',
                    'is_active': False,
                    'subscription_end': None
                }
            
            # Check if subscription is still active
            is_active = True
            if user.subscription_end and user.subscription_end < datetime.utcnow():
                is_active = False
                # Auto-downgrade to free if subscription expired
                user.subscription_type = 'free'
                user.is_active = False
                db.commit()
            
            return {
                'subscription_type': user.subscription_type or 'free',
                'is_active': is_active,
                'subscription_end': user.subscription_end.isoformat() if user.subscription_end else None,
                'subscription_start': user.subscription_start.isoformat() if user.subscription_start else None
            }
            
        except Exception as e:
            logger.error(f"Error getting subscription status: {str(e)}")
            return {
                'subscription_type': 'free',
                'is_active': False,
                'subscription_end': None
            }