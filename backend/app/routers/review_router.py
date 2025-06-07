# app/routes/reviews.py
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.schemas import ReviewCreate, ReviewResponse, ReviewUpdate, APIResponse
from app.core.database import get_db  # ✅ Only import get_db from database
from app.models.user import User      # ✅ Import User from models
from app.models.review import Review  # ✅ Import Review from mode
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api", tags=["reviews"])

@router.post("/reviews", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def submit_review(review_data: ReviewCreate, db: Session = Depends(get_db)):
    """Submit a new review or update existing review."""
    try:
        # Check if user exists
        user = db.query(User).filter(User.email == review_data.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found. Please register first."
            )
        
        # Check if user already has a review
        existing_review = db.query(Review).filter(Review.email == review_data.email).first()
        
        if existing_review:
            # Update existing review
            existing_review.rating = review_data.rating
            existing_review.feedback = review_data.feedback
            existing_review.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(existing_review)
            
            return APIResponse(
                message="Review updated successfully",
                success=True,
                data={
                    "id": existing_review.id,
                    "rating": existing_review.rating,
                    "feedback": existing_review.feedback,
                    "updated_at": existing_review.updated_at.isoformat()
                }
            )
        else:
            # Create new review
            new_review = Review(
                email=review_data.email,
                rating=review_data.rating,
                feedback=review_data.feedback
            )
            
            db.add(new_review)
            db.commit()
            db.refresh(new_review)
            
            return APIResponse(
                message="Review submitted successfully",
                success=True,
                data={  
                    "id": new_review.id,
                    "rating": new_review.rating,
                    "feedback": new_review.feedback,
                    "created_at": new_review.created_at.isoformat()
                }
            )
            
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error. Please check your data."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while submitting the review: {str(e)}"
        )

@router.get("/reviews", response_model=List[ReviewResponse])
async def get_all_reviews(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get all reviews with pagination."""
    reviews = db.query(Review).offset(skip).limit(limit).all()
    return reviews

@router.get("/reviews/{email}", response_model=ReviewResponse)
async def get_user_review(email: str, db: Session = Depends(get_db)):
    """Get a specific user's review."""
    review = db.query(Review).filter(Review.email == email).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found for this user"
        )
    return review

@router.put("/reviews/{email}", response_model=APIResponse)
async def update_review(
    email: str, 
    review_data: ReviewUpdate, 
    db: Session = Depends(get_db)
):
    """Update a user's review."""
    review = db.query(Review).filter(Review.email == email).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found for this user"
        )
    
    # Update fields that are provided
    if review_data.rating is not None:
        review.rating = review_data.rating
    if review_data.feedback is not None:
        review.feedback = review_data.feedback
    
    review.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(review)
        return APIResponse(
            message="Review updated successfully",
            success=True,
            data={
                "id": review.id,
                "rating": review.rating,
                "feedback": review.feedback,
                "updated_at": review.updated_at.isoformat()
            }
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating review: {str(e)}"
        )

@router.delete("/reviews/{email}", response_model=APIResponse)
async def delete_review(email: str, db: Session = Depends(get_db)):
    """Delete a user's review."""
    review = db.query(Review).filter(Review.email == email).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found for this user"
        )
    
    try:
        db.delete(review)
        db.commit()
        return APIResponse(message="Review deleted successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting review: {str(e)}"
        )

@router.get("/reviews/stats/summary")
async def get_review_stats(db: Session = Depends(get_db)):
    """Get review statistics."""
    from sqlalchemy import func
    
    stats = db.query(
        func.count(Review.id).label('total_reviews'),
        func.avg(Review.rating).label('average_rating'),
        func.max(Review.rating).label('max_rating'),
        func.min(Review.rating).label('min_rating')
    ).first()
    
    # Get rating distribution
    rating_distribution = db.query(
        Review.rating,
        func.count(Review.id).label('count')
    ).group_by(Review.rating).all()
    
    return {
        "total_reviews": stats.total_reviews or 0,
        "average_rating": round(float(stats.average_rating or 0), 2),
        "max_rating": stats.max_rating or 0,
        "min_rating": stats.min_rating or 0,
        "rating_distribution": {str(rating): count for rating, count in rating_distribution}
    }