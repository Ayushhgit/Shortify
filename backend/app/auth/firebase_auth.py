import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Request, status
from typing import Dict, Any
from app.core.config import settings

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK if not already initialized"""
    if not firebase_admin._apps:
        # Use environment variable for credentials path
        cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS or "/app/firebase-credentials.json"

        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print(f"Firebase initialized with credentials from: {cred_path}")
        except Exception as e:
            print(f"Failed to initialize Firebase: {e}")
            raise e




async def verify_firebase_token(token: str) -> Dict[str, Any]:
    """
    Verify Firebase ID token and return user data
    
    Args:
        token: Firebase ID token
        
    Returns:
        Dictionary containing user data
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_firebase_user(request: Request) -> Dict[str, Any]:
    """
    Get current user from Firebase token in Authorization header
    
    Args:
        request: FastAPI request object
        
    Returns:
        Dictionary containing user data
        
    Raises:
        HTTPException: If token is missing or invalid
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ")[1]
    # This would need to be made async if verify_firebase_token is async
    # For now, assuming sync operation
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )