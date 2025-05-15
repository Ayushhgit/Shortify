import logging
from pathlib import Path
from typing import List, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

class GPTEnhancer:
    @staticmethod
    async def enhance_segments(
        video_path: Path,
        segments: List[Tuple[float, float, float]]
    ) -> List[Tuple[float, float, float]]:
        if not settings.USE_GPT or not settings.OPENAI_API_KEY:
            logger.info("GPT enhancement skipped.")
            return segments
        logger.info(f"Mock GPT enhancement for {video_path}")
        return segments
