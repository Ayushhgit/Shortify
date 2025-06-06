from fastapi import APIRouter, HTTPException
from app.models.schemas import review

router = APIRouter()

reviews_db = [] #demo db

@router.post("/api/review")
async def submit_review(review: review):
    if not (1 <= review.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    #replace with db
    reviews_db.append(review.dict())

    return {"message": "Review submitted successfully", "data": review}