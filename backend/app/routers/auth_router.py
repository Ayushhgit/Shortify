from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging

from app.core.database import get_db
from app.models.user import User
from app.models.schemas import SubscriptionTypeEnum, UserCreate, UserResponse
from app.auth.firebase_auth import verify_firebase_token

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
    responses={404: {"description": "Not found"}},
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post("/firebase", response_model=UserResponse)
async def firebase_auth(
    user_data: Dict[str, Any] = Body(...),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Authenticate user with Firebase and create/update user in database
    
    Requires Firebase ID token in Authorization header
    """
    try:
        # Verify Firebase token
        firebase_user = await verify_firebase_token(token)
        
        # Check if verified user matches the request
        if firebase_user["uid"] != user_data.get("uid"):
            logger.warning(f"User ID mismatch: {firebase_user['uid']} vs {user_data.get('uid')}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID mismatch",
            )
        
        # Find existing user or create new one
        db_user = db.query(User).filter(User.email == user_data.get("email")).first()
        
        if not db_user:
            # Create new user
            logger.info(f"Creating new user with email: {user_data.get('email')}")
            user_create = UserCreate(
                email=user_data.get("email"),
                name=user_data.get("name", ""),
                firebase_uid=user_data.get("uid"),
            )
            
            db_user = User(
                email=user_create.email,
                name=user_create.name,
                firebase_uid=user_create.firebase_uid,
                is_active=True,
            )
            
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        else:
            # Update existing user
            logger.info(f"Updating existing user: {db_user.id}")
            db_user.firebase_uid = user_data.get("uid")
            db_user.name = user_data.get("name", db_user.name)
            db_user.is_active = True
            
            db.commit()
            db.refresh(db_user)
        
        return UserResponse(
            id=db_user.id,
            email=db_user.email,
            name=db_user.name,
            is_active=db_user.is_active,
            subscription_type=db_user.subscription_type or SubscriptionTypeEnum.free,
        )
    except Exception as e:
        logger.error(f"Error in firebase_auth: {str(e)}")
        raise

@router.post("/login", response_model=UserResponse)
async def login(
    login_data: Dict[str, Any] = Body(...),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Login endpoint for existing users
    
    Requires Firebase ID token in Authorization header
    """
    try:
        # Verify Firebase token
        firebase_user = await verify_firebase_token(token)
        
        # Find user in database
        db_user = db.query(User).filter(User.firebase_uid == firebase_user["uid"]).first()
        
        if not db_user:
            logger.warning(f"User not found for uid: {firebase_user['uid']}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # Update last login or other user data if needed
        db_user.is_active = True
        db.commit()
        db.refresh(db_user)
        
        return UserResponse(
            id=db_user.id,
            email=db_user.email,
            name=db_user.name,
            is_active=db_user.is_active,
            subscription_type=db_user.subscription_type or SubscriptionTypeEnum.free,
        )
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        raise

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Get current user profile
    
    Requires Firebase ID token in Authorization header
    """
    try:
        # Verify Firebase token
        firebase_user = await verify_firebase_token(token)
        
        # Find user in database
        db_user = db.query(User).filter(User.firebase_uid == firebase_user["uid"]).first()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        return UserResponse(
            id=db_user.id,
            email=db_user.email,
            name=db_user.name,
            is_active=db_user.is_active,
            subscription_type=db_user.subscription_type or SubscriptionTypeEnum.free,
        )
    except Exception as e:
        logger.error(f"Error in get_current_user_profile: {str(e)}")
        raise

