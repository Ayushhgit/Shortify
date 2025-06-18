from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, logger, status
from app.models.schemas import YouTubeRequest
from app.services.yt_summarizer import generate_summary
from app.utils.youtube_utils import get_transcript_and_details
import traceback
from app.core.rate_limiting import yt_summarization_rate_limit

router = APIRouter(prefix="/api/ytSummary", tags=["YT Processing"])


@router.post("/summarize")
async def summarize_video(
    request: YouTubeRequest,
    rate_limit_data: dict = Depends(yt_summarization_rate_limit)
):
    try:
        user = rate_limit_data['user']
        rate_info = rate_limit_data['rate_limit_info']
        
        transcript, details = get_transcript_and_details(request.url)
        summary = generate_summary(transcript)
        
        return {
            "summary": summary,
            "videoDetails": details,
            "usage_info": {
                "remaining": rate_info['remaining'],
                "limit": rate_info['limit'],
                "subscription": rate_info['subscription']
            }
        }
    except ValueError as e:
        # Handle invalid URLs or transcript unavailable
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while processing the video")