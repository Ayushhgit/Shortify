from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from app.models.schemas import YouTubeRequest
from app.services.yt_summarizer import generate_summary
from app.utils.youtube_utils import get_transcript_and_details


router = APIRouter(prefix="/api/ytSummary", tags=["YT Processing"])


@router.post("/summarize")
async def summarize_video(request: YouTubeRequest):
    try:
        transcript, details = get_transcript_and_details(request.url)
        summary = generate_summary(transcript)
        return {
            "summary": summary,
            "videoDetails": details
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))