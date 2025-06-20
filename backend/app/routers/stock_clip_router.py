from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from app.models.schemas import VideoRequest
from app.services.stockClip_generate import (
    generate_script, 
    generate_enhanced_tts as generate_tts,
    generate_precise_captions_with_gemini as generate_captions,
    combine_video_audio_captions_enhanced as combine_video_audio_captions
)
import os
import uuid
import logging
from ..core.config import Settings
from app.core.rate_limiting import clip_generation_rate_limit

setting = Settings()
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/clip", tags={"Clip Generator"})

@router.post("/generate-video", status_code=200)
async def generate_video_endpoint(
    request: VideoRequest,
    rate_limit_data: dict = Depends(clip_generation_rate_limit)
):
    """Generate video with large, readable subtitles and proper audio sync."""
    
    try:
        user = rate_limit_data['user']
        
        if not request.topic or not request.topic.strip():
            raise HTTPException(status_code=400, detail="Topic cannot be empty")

        job_id = str(uuid.uuid4())
        output_filename = f"{job_id}.mp4"
        final_output_path = os.path.join(setting.OUTPUT_DIR, output_filename)
        stock_video_path = os.path.join(setting.ASSETS_DIR, "minecraft.mp4")

        if not os.path.exists(stock_video_path):
            raise HTTPException(status_code=500, detail="Stock video file missing")

        logger.info(f"Starting video generation for: '{request.topic}' [ID: {job_id}]")

        # Step 1: Generate script
        logger.info(f"[{job_id}] Generating script...")
        script = generate_script(request.topic)
        
        # Step 2: Generate audio
        logger.info(f"[{job_id}] Generating audio...")
        audio_path = generate_tts(script, job_id, setting.TEMP_DIR)
        
        # Step 3: Generate captions
        logger.info(f"[{job_id}] Generating captions...")
        captions = generate_captions(script, audio_path)
        
        # Step 4: Combine everything
        logger.info(f"[{job_id}] Creating final video...")
        combine_video_audio_captions(
            stock_video_path=stock_video_path,
            audio_path=audio_path,
            captions=captions,
            output_path=final_output_path
        )
        
        logger.info(f"[{job_id}] Video generation completed successfully")

        return {
            "message": "Video generated successfully with large readable subtitles!",
            "video_url": f"/videos/{output_filename}",
            "details": {
                "script_length": len(script.split()),
                "caption_count": len(captions),
                "improvements": [
                    "Large readable font size",
                    "Proper audio-text synchronization", 
                    "Bold text with black outline",
                    "Bottom screen positioning"
                ]
            }
        }

    except Exception as e:
        logger.exception(f"Video generation failed for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Video generation failed: {str(e)}")

@router.get("/videos/{video_name}")
async def get_video(video_name: str):
    """Serve generated video file."""
    video_path = os.path.join(setting.OUTPUT_DIR, video_name)
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video not found")
    
    return FileResponse(
        video_path, 
        media_type="video/mp4", 
        filename=video_name
    )