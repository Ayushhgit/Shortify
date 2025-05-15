import logging
from typing import Dict, Any, List, Optional

from app.utils.downloader import VideoDownloader
from app.utils.analyzer import VideoAnalyzer
from app.utils.editor import VideoEditor
from app.models.schemas import VideoClipsResponse, ClipInfo, TaskStatusEnum
from app.core.config import settings

logger = logging.getLogger(__name__)


class ShortsService:
    @staticmethod
    async def process_video(
        url: str,
        use_whisper: bool = False,
        use_gpt: bool = False,
        task_id: Optional[str] = None
    ) -> VideoClipsResponse:
        """
        Download a YouTube video, analyze for viral segments, and generate short clips.

        Args:
            url (str): YouTube video URL
            use_whisper (bool): Whether to use Whisper for transcription
            use_gpt (bool): Whether to use GPT-4 for analyzing virality
            task_id (Optional[str]): Celery task ID for tracking

        Returns:
            VideoClipsResponse: Result containing generated clips
        """
        try:
            logger.info(f"[ShortsService] Starting processing for: {url}")

            # Step 1: Download the video
            video_id, video_path, video_info = await VideoDownloader.download_youtube(url)
            logger.info(f"[ShortsService] Video downloaded: {video_path} (ID: {video_id})")

            # Step 2: Analyze for viral segments
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

            # Step 3: Generate clips
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
