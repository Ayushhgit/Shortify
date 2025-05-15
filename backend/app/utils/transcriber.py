import logging
from pathlib import Path
from typing import List, Tuple, Dict, Any
from app.core.config import settings
from app.utils.analyzer import VideoAnalyzer

import openai
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class WhisperTranscriber:
    @staticmethod
    async def transcribe_video(video_path: Path) -> Dict[str, Any]:
        if not settings.USE_WHISPER or not settings.OPENAI_API_KEY:
            logger.info("Whisper transcription skipped.")
            return {}
        
        audio_path = await VideoAnalyzer.extract_audio(video_path)
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        with open(audio_path, "rb") as f:
            transcript = await client.audio.transcriptions.create(
                file=f,
                model="whisper-1",
                response_format="verbose_json" 
            )
        return transcript
    @staticmethod
    async def enhance_segments(
        video_path: Path,
        segments: List[Tuple[float, float, float]]
    ) -> List[Tuple[float, float, float]]:
        _ = await WhisperTranscriber.transcribe_video(video_path)
        return segments
