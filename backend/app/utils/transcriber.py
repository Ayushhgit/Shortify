import logging
from pathlib import Path
from typing import List, Tuple, Dict, Any
from app.core.config import settings
from openai import AsyncOpenAI
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

class WhisperTranscriber:

    model = WhisperModel("base", device="cpu", compute_type="int8")
    @staticmethod
    async def transcribe_audio(audio_path: Path) -> Dict[str, Any]:
        """Transcribe audio using faster-whisper."""
        try:
            logger.info(f"Transcribing audio locally with Faster-Whisper: {audio_path}")

            segments_generator, info = WhisperTranscriber.model.transcribe(str(audio_path), beam_size=5)

            transcript_text = ""
            segments_list = []

            for segment in segments_generator:
                start, end, text = segment.start, segment.end, segment.text
                segments_list.append({"start": start, "end": end, "text": text})
                transcript_text += text.strip() + " "

            logger.info(f"Faster-Whisper transcription complete for: {audio_path}")

            return {
                "text": transcript_text.strip(),
                "segments": segments_list,
                "duration": info.duration
            }

        except Exception as e:
            logger.error(f"Faster-Whisper Transcription Failed: {e}")
            return {}

    @staticmethod
    async def transcribe_video(video_path: Path) -> Dict[str, Any]:
        """Transcribe a video file by first extracting audio."""
        from app.utils.analyzer import VideoAnalyzer
        audio_path = await VideoAnalyzer.extract_audio(video_path)
        return await WhisperTranscriber.transcribe_audio(audio_path)

    @staticmethod
    async def enhance_segments(video_path: Path, segments: List[Tuple[float, float, float]]) -> List[Tuple[float, float, float]]:
        """Enhance segments using transcript data."""
        from app.utils.analyzer import VideoAnalyzer
        audio_path = await VideoAnalyzer.extract_audio(video_path)
        transcript_data = await WhisperTranscriber.transcribe_audio(audio_path)

        # Optional: Use `transcript_data["segments"]` to refine input `segments` based on speech timestamps
        return segments