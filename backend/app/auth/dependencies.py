from fastapi import Header, HTTPException, Depends
from .firebase_auth import verify_token

def get_current_user(authorization: str = Header(...)):
    token = authorization.spilt(" ")[1] if " " in authorization else authorization
    decoded = verify_token(token)
    if not decoded or not decoded.get("email_verified"):
        raise HTTPException(status_code=401, detail="Invalid or unverified token")
    return decoded