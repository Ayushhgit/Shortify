from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status,Body
from typing import Optional

from app.models.schemas import VideoGenerateRequest, VideoClipsResponse, TaskStatusResponse
from app.services.shorts import ShortsService
from app.tasks.shorts import generate_shorts
from app.core.security import get_current_user
from app.core.config import settings

router = APIRouter()

@router.post("/generate", response_model=TaskStatusResponse)
async def create_shorts(
    request: VideoGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: Optional[dict] = None,  # Uncomment if using authentication
):
    """
    Generate short clips from a YouTube video
    
    - **url**: YouTube URL to process
    - **use_whisper**: Whether to use Whisper for transcription (optional)
    - **use_gpt**: Whether to use GPT for virality analysis (optional)
    
    Returns a task ID that can be used to check progress
    """
    # Check if features are available
    if request.use_whisper and not settings.USE_WHISPER:
        request.use_whisper = False
    
    if request.use_gpt and not settings.USE_GPT:
        request.use_gpt = False
    
    try:
        # Start Celery task
        task = generate_shorts.delay(
            str(request.url),
            request.use_whisper,
            request.use_gpt
        )
        
        # Return task information
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
    """
    Get status of a shorts generation task
    
    - **task_id**: ID of the task to check
    
    Returns task status and progress
    """
    from app.tasks.shorts import get_task_status
    
    try:
        # Get task status
        status_info = get_task_status(task_id)
        
        # Convert to response model
        response = TaskStatusResponse(**status_info)
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get task status: {str(e)}"
        )
