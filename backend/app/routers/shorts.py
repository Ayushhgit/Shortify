# --- app/routers/shorts.py ---
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from typing import Optional

from app.models.schemas import VideoGenerateRequest, TaskStatusResponse
from app.services.shorts import ShortsService
from app.tasks.shorts import generate_shorts, get_task_status
from app.core.security import get_current_user
from app.core.config import settings

router = APIRouter()


@router.post("/generate", response_model=TaskStatusResponse)
async def create_shorts(
    request: VideoGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: Optional[dict] = None,
):
    if request.use_whisper and not settings.USE_WHISPER:
        request.use_whisper = False

    if request.use_gpt and not settings.USE_GPT:
        request.use_gpt = False

    try:
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

