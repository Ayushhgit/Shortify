import logging
from pathlib import Path
from typing import List, Tuple
from app.core.config import settings
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class GPTEnhancer:
    @staticmethod
    async def enhance_segments(video_path: Path, segments: List[Tuple[float, float, float]]) -> List[Tuple[float, float, float]]:

        if not settings.USE_GPT or not settings.OPENAI_API_KEY:
            logger.info("GPT enhancement skipped.")
            return segments
        
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Get transcript
        from app.utils.transcriber import WhisperTranscriber
        transcript_data = await WhisperTranscriber.transcribe_video(video_path)
        transcript_segments = transcript_data.get("segments", [])

        enhanced_segments = []
        for (start, end, confidence) in segments:
            text = ""
            for segment in transcript_segments:
                seg_start = segment.get("start", 0)
                seg_end = segment.get("end", 0)
                if start <= seg_end and end >= seg_start:
                    text += segment.get("text", "")

            if text.strip():
                prompt = (
                    "You're a virality expert. Score the following clip transcript "
                    "on a scale of 0–1 based on how emotionally engaging, funny, "
                    "insightful, or dramatic it is (high virality means closer to 1). "
                    "Only return the float.\n\n"
                    f"Transcript:\n{text.strip()}"
                )
                try:
                    response = await client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[{"role": "user", "content": prompt}]
                    )

                    gpt_score = float(response.choices[0].message.content.strip())
                    combined_score = 0.6 * confidence + 0.4 * gpt_score
                    enhanced_segments.append((start, end, combined_score))
                except Exception as e:
                    logger.warning(f"GPT scoring failed for segment {start}-{end}: {e}")
                    enhanced_segments.append((start, end, confidence))
            else:
                enhanced_segments.append((start, end, confidence))

        return enhanced_segments
