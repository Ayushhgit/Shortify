# --- app/routers/shorts.py ---
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from typing import Optional

from app.models.schemas import VideoGenerateRequest, TaskStatusResponse
from app.services.shorts import ShortsService
from app.tasks.shorts import generate_shorts, get_task_status
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.core.database import get_db
from sqlalchemy.orm import Session


router = APIRouter()

SUBSCRIPTION_LIMITS = {
    "free": 2,
    "pro": 5,
    "premium": 10,
}

@router.post("/generate", response_model=TaskStatusResponse)
async def create_shorts(
    request: VideoGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: Optional[dict] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if request.use_whisper and not settings.USE_WHISPER:
        request.use_whisper = False

    if request.use_gpt and not settings.USE_GPT:
        request.use_gpt = False

    try:
        # Fetch user record from DB
        user = db.query(User).filter(User.firebase_uid == current_user["uid"]).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get user's subscription limit
        subscription = (user.subscription_type or "free").lower()
        limit = SUBSCRIPTION_LIMITS.get(subscription, 2)

        if (user.video_generation_count or 0) >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Video generation limit reached for {subscription} users"
            )

        # Increment count
        user.video_generation_count = (user.video_generation_count or 0) + 1
        db.commit()

        # Start async video generation
        task = generate_shorts.delay(
            str(request.url),
            request.use_whisper,
            request.use_gpt
        )

        return TaskStatusResponse(
            task_id=task.id,
            status="pending",
            progress=0
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start task: {str(e)}"
        )


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_shorts_status(task_id: str):
    try:
        status_info = get_task_status(task_id)
        return TaskStatusResponse(**status_info)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get task status: {str(e)}"
        )

