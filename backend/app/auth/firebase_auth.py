import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Request, status
from typing import Dict, Any, Optional

# Initialize Firebase Admin SDK
# You'll need to provide a path to your service account JSON file
# Generate this from Firebase Console > Project Settings > Service accounts
try:
    cred = credentials.Certificate(r"A:\ML-Project\short-ify\backend\shortify-876e7-firebase-adminsdk-fbsvc-9193bebcff.json")
    firebase_app = firebase_admin.initialize_app(cred)
except ValueError:
    # App already initialized
    firebase_app = firebase_admin.get_app()

async def verify_firebase_token(token: str) -> Dict[str, Any]:
    """
    Verify Firebase ID token and return user data 
    Args:token: Firebase ID token
    Returns:Dictionary containing user data
    Raises: HTTPException: If token is invalid or expired
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
    """ Get current user from Firebase token in Authorization header
    Args: request: FastAPI request object
    Returns: Dictionary containing user data
    Raises: HTTPException: If token is missing or invalid"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ")[1]
    return verify_firebase_token(token)