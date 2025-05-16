from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/config")
def get_config():
    return {
        "use_gpt":settings.USE_GPT,
        "use_whisper": settings.USE_WHISPER
    }