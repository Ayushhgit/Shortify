from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.utils.firebase_auth import verify_firebase_token
from app.models.user import User

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/auth/firebase")
def create_or_update_user(request: Request, db: Session = Depends(get_db)):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return {"error": "No valid token found"}

    id_token = token.split(" ")[1]
    decoded = verify_firebase_token(id_token)

    if not decoded.get("email_verified"):
        return {"error": "Email not verified"}

    uid = decoded["uid"]
    email = decoded["email"]
    name = decoded.get("name", "")

    user = db.query(User).filter_by(uid=uid).first()
    if not user:
        user = User(uid=uid, email=email, name=name, email_verified=True)
        db.add(user)
    else:
        user.email_verified = True
        user.name = name
    db.commit()

    return {"message": "User authenticated and stored"}
