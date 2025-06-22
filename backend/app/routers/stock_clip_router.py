from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from app.models.schemas import VideoRequest
import asyncio
import os
import time
import uuid
from app.core.config import Settings
from app.services.stockClip_generate import generate_video_async
import logging
import re

logger = logging.getLogger(__name__)

settings = Settings()

router = APIRouter(prefix="/clip", tags=["Clip Generator"])

@router.post("/generate-video", status_code=200)
async def generate_video_endpoint(
    request: VideoRequest,
    background_tasks: BackgroundTasks,
):
    """Generate video with large, readable subtitles and proper audio sync."""
    
    # Validate input
    if not request.topic or not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    
    if len(request.topic.strip()) > 200:
        raise HTTPException(status_code=400, detail="Topic too long (max 200 characters)")
    

    job_id = str(uuid.uuid4())
    output_filename = f"{job_id}.mp4"
    final_output_path = os.path.join(settings.OUTPUT_DIR, output_filename)
    stock_video_path = os.path.join(settings.ASSETS_DIR, "minecraft.mp4")
    
    # Validate required files
    if not os.path.exists(stock_video_path):
        raise HTTPException(status_code=500, detail="Stock video file missing")
    
    # Ensure directories exist
    os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
    os.makedirs(settings.TEMP_DIR, exist_ok=True)
    
    try:
        # Generate video asynchronously
        result = await generate_video_async(
            topic=request.topic.strip(),
            job_id=job_id,
            stock_video_path=stock_video_path,
            output_path=final_output_path,
            temp_dir=settings.TEMP_DIR
        )
        
        if not result.success:
            raise HTTPException(status_code=500, detail=f"Video generation failed: {result.error_message}")
        
        # Schedule cleanup of old files in background
        background_tasks.add_task(cleanup_old_videos, settings.OUTPUT_DIR)
        
        return {
            "message": "Video generated successfully with large readable subtitles!",
            "video_url": f"/videos/{output_filename}",
            "job_id": job_id,
            "details": {
                "script_length": result.script_length,
                "caption_count": result.caption_count,
                "improvements": [
                    "Responsive font sizing",
                    "Precise audio-text synchronization", 
                    "High contrast styling with stroke",
                    "Optimized bottom positioning",
                    "Improved error handling",
                    "Async processing for better performance"
                ]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[{job_id}] Unexpected error in video generation endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error occurred")

@router.get("/videos/{video_name}")
async def get_video(video_name: str):
    """Serve generated video file with proper validation."""
    # Validate filename to prevent directory traversal
    if not re.match(r'^[a-f0-9\-]+\.mp4$', video_name):
        raise HTTPException(status_code=400, detail="Invalid video filename")
    
    video_path = os.path.join(settings.OUTPUT_DIR, video_name)
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video not found")
    
    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=video_name,
        headers={"Cache-Control": "public, max-age=3600"}  # Cache for 1 hour
    )

async def cleanup_old_videos(output_dir: str, max_age_hours: int = 24):
    """Clean up video files older than specified hours."""
    try:
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        for filename in os.listdir(output_dir):
            if filename.endswith('.mp4'):
                file_path = os.path.join(output_dir, filename)
                file_age = current_time - os.path.getctime(file_path)
                
                if file_age > max_age_seconds:
                    try:
                        os.remove(file_path)
                        logger.info(f"Cleaned up old video: {filename}")
                    except Exception as e:
                        logger.warning(f"Failed to clean up {filename}: {e}")
                        
    except Exception as e:
        logger.exception(f"Error during video cleanup: {e}")