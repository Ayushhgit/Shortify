from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from typing import Optional
from app.core.config import settings
from app.models.schemas import VideoGenerateRequest, TaskStatusResponse
from app.services.shorts import ShortsService
from app.tasks.shorts import generate_shorts, get_task_status
from app.core.rate_limiting import video_generation_rate_limit

router = APIRouter()

@router.post("/generate", response_model=TaskStatusResponse)
async def create_shorts(
    request: VideoGenerateRequest,
    background_tasks: BackgroundTasks,
    rate_limit_data: dict = Depends(video_generation_rate_limit)
):
    """Generate shorts with rate limiting"""
    
    if request.use_whisper and not settings.USE_WHISPER:
        request.use_whisper = False
    
    if request.use_gpt and not settings.USE_GPT:
        request.use_gpt = False
    
    try:
        user = rate_limit_data['user']
        rate_info = rate_limit_data['rate_limit_info']
        
        # Start async video generation
        task = generate_shorts.delay(
            str(request.url),
            request.use_whisper,
            request.use_gpt
        )
        
        return TaskStatusResponse(
            task_id=task.id,
            status="pending",
            progress=0,
            remaining_usage=rate_info['remaining']
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