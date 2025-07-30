from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from typing import Optional
from app.core.config import settings
from app.models.schemas import VideoGenerateRequest, TaskStatusResponse
from app.services.shorts import ShortsService
from app.tasks.shorts import generate_shorts, get_task_status
from app.core.rate_limiting import video_generation_rate_limit

router = APIRouter()

def safe_video_generation_rate_limit():
    """
    Safe wrapper for rate limiting that handles user not found cases
    """
    try:
        return video_generation_rate_limit()
    except HTTPException as e:
        if e.status_code == 404:  # User not found
            # Return default values for guest users
            return {
                'user': None,
                'rate_limit_info': {
                    'remaining': 10,  # Allow 10 generations for guests
                    'limit': 10,
                    'reset_time': None
                }
            }
        # Re-raise other HTTP exceptions
        raise e
    except Exception as e:
        # Handle any other exceptions and provide guest access
        return {
            'user': None,
            'rate_limit_info': {
                'remaining': 5,  # More conservative limit for errors
                'limit': 5,
                'reset_time': None
            }
        }

@router.post("/generate", response_model=TaskStatusResponse)
async def create_shorts(
    request: VideoGenerateRequest,
    background_tasks: BackgroundTasks,
    rate_limit_data: dict = Depends(safe_video_generation_rate_limit)
):
    """Generate shorts with safe rate limiting"""
    
    # Apply settings overrides
    if request.use_whisper and not settings.USE_WHISPER:
        request.use_whisper = False
        
    if request.use_gpt and not settings.USE_GPT:
        request.use_gpt = False
    
    try:
        user = rate_limit_data.get('user')
        rate_info = rate_limit_data.get('rate_limit_info', {'remaining': 5})
        
        # Check if user has remaining usage
        if rate_info.get('remaining', 0) <= 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
        
        # Log user info for debugging
        user_info = f"User ID: {user.get('id') if user else 'Guest'}" if user else "Guest User"
        print(f"Processing request for {user_info}, Remaining: {rate_info.get('remaining', 'Unknown')}")
        
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
            remaining_usage=rate_info.get('remaining', 0)
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (like rate limit exceeded)
        raise
    except Exception as e:
        print(f"Error in create_shorts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start task: {str(e)}"
        )

@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_shorts_status(task_id: str):
    """Get the status of a shorts generation task"""
    try:
        status_info = get_task_status(task_id)
        return TaskStatusResponse(**status_info)
    except Exception as e:
        print(f"Error getting task status for {task_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get task status: {str(e)}"
        )

# Alternative approach - completely bypass rate limiting if needed
@router.post("/generate-guest", response_model=TaskStatusResponse)
async def create_shorts_guest(
    request: VideoGenerateRequest,
    background_tasks: BackgroundTasks
):
    """Generate shorts without authentication - for testing/guest access"""
    
    # Apply settings overrides
    if request.use_whisper and not settings.USE_WHISPER:
        request.use_whisper = False
        
    if request.use_gpt and not settings.USE_GPT:
        request.use_gpt = False
    
    try:
        # Start async video generation without rate limiting
        task = generate_shorts.delay(
            str(request.url),
            request.use_whisper,
            request.use_gpt
        )
        
        return TaskStatusResponse(
            task_id=task.id,
            status="pending",
            progress=0,
            remaining_usage=1  # Unlimited for guest endpoint
        )
        
    except Exception as e:
        print(f"Error in create_shorts_guest: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start task: {str(e)}"
        )

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "shorts-generator",
        "whisper_enabled": settings.USE_WHISPER,
        "gpt_enabled": settings.USE_GPT
    }