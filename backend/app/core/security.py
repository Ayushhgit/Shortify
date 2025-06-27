from firebase_admin import auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import firebase_admin
from app.core.config import settings

# Initialize Firebase Admin SDK only once
def initialize_firebase():
    """Initialize Firebase Admin SDK if not already initialized"""
    if not firebase_admin._apps:
        # Use environment variable for credentials path
        cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS or '/app/firebase-credentials.json'
        
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print(f"Firebase initialized with credentials from: {cred_path}")
        except Exception as e:
            print(f"Failed to initialize Firebase: {e}")
            raise e

# Initialize Firebase when module is imported
initialize_firebase()

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials  # Extracts the Bearer token
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate Firebase credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token 
    except Exception:
        raise credentials_exception
