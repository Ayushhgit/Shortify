from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from app.models.schemas import VideoRequest
from app.services.stockClip_generate import generate_script, generate_tts, generate_captions_from_script, combine_video_audio_captions
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
    """
    Accepts a topic, generates a video synchronously, and returns the URL to the final video.
    """
    try:
        user = rate_limit_data['user']
        rate_info = rate_limit_data['rate_limit_info']

        if not request.topic or not request.topic.strip():
            raise HTTPException(status_code=400, detail="Topic cannot be empty.")

        job_id = str(uuid.uuid4())
        output_filename = f"{job_id}.mp4"
        final_output_path = os.path.join(setting.OUTPUT_DIR, output_filename)
        stock_video_path = os.path.join(setting.ASSETS_DIR, "minecraft.mp4")

        if not os.path.exists(stock_video_path):
            logger.error(f"Stock video not found at {stock_video_path}")
            raise HTTPException(status_code=500, detail="Stock video file is missing from the server.")

        
        logger.info(f"Received request for topic: '{request.topic}' with job ID: {job_id}")
        
        # --- Step 1: Generate Script using Groq ---
        logger.info(f"[{job_id}] Step 1: Generating script...")
        script = generate_script(request.topic)
        logger.info(f"[{job_id}] Script generated successfully.")

        # --- Step 2: Generate TTS Audio using gTTS ---
        logger.info(f"[{job_id}] Step 2: Generating TTS audio...")
        audio_path = generate_tts(script, job_id, setting.TEMP_DIR)
        logger.info(f"[{job_id}] Audio saved at: {audio_path}")

        # --- Step 3: Generate Captions ---
        logger.info(f"[{job_id}] Step 3: Generating captions...")
        captions = generate_captions_from_script(script, audio_path)
        logger.info(f"[{job_id}] Captions generated successfully.")
        
        # --- Step 4: Combine video, audio, and captions ---
        logger.info(f"[{job_id}] Step 4: Combining video, audio, and captions...")
        combine_video_audio_captions(
            stock_video_path=stock_video_path,
            audio_path=audio_path,
            captions=captions,
            output_path=final_output_path,
            temp_dir=setting.TEMP_DIR
        )
        logger.info(f"[{job_id}] Final video saved at: {final_output_path}")

        # --- Return Response ---
        return {
            "message": "Video generation completed successfully!",
            "video_url": f"/videos/{output_filename}"
        }

    except Exception as e:
        logger.exception(f"An error occurred during video generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/videos/{video_name}")
async def get_video(video_name: str):
    """Serves a generated video file from the output directory."""
    video_path = os.path.join(setting.OUTPUT_DIR, video_name)
    logger.info(f"Attempting to serve video: {video_path}")
    if not os.path.exists(video_path):
        logger.error(f"Video not found at path: {video_path}")
        raise HTTPException(status_code=404, detail="Video not found.")
    return FileResponse(video_path, media_type="video/mp4", filename=video_name)

