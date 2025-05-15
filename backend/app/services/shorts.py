# --- app/services/shorts.py ---
import logging
from typing import Optional

from app.utils.downloader import VideoDownloader
from app.utils.analyzer import VideoAnalyzer
from app.utils.editor import VideoEditor
from app.models.schemas import VideoClipsResponse, TaskStatusEnum

logger = logging.getLogger(__name__)


class ShortsService:
    @staticmethod
    async def process_video(
        url: str,
        use_whisper: bool = False,
        use_gpt: bool = False,
        task_id: Optional[str] = None
    ) -> VideoClipsResponse:
        try:
            logger.info(f"[ShortsService] Starting processing for: {url}")

            video_id, video_path, video_info = await VideoDownloader.download_youtube(url)
            logger.info(f"[ShortsService] Video downloaded: {video_path} (ID: {video_id})")

            segments = await VideoAnalyzer.find_viral_segments(
                video_path, use_whisper=use_whisper, use_gpt=use_gpt
            )

            if not segments:
                logger.warning(f"[ShortsService] No segments found for video {video_id}")
                return VideoClipsResponse(
                    video_id=video_id,
                    original_url=url,
                    clips=[],
                    task_id=task_id,
                    status=TaskStatusEnum.failed
                )

            logger.info(f"[ShortsService] {len(segments)} segments found for video {video_id}")

            clips = await VideoEditor.create_clips(video_path, segments)
            logger.info(f"[ShortsService] {len(clips)} clips created for video {video_id}")

            return VideoClipsResponse(
                video_id=video_id,
                original_url=url,
                clips=clips,
                task_id=task_id,
                status=TaskStatusEnum.completed
            )

        except Exception as e:
            logger.error(f"[ShortsService] Error processing video {url}: {e}", exc_info=True)
            return VideoClipsResponse(
                video_id="error",
                original_url=url,
                clips=[],
                task_id=task_id,
                status=TaskStatusEnum.failed
            )

