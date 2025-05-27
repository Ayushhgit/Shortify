from firebase_admin import auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin

# Initialize Firebase Admin SDK only once
cred = credentials.Certificate(r"C:\Hari om\Shortify\backend\shortify-876e7-firebase-adminsdk-fbsvc-9193bebcff.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

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
        return decoded_token  # You get uid, email, etc.
    except Exception:
        raise credentials_exception
