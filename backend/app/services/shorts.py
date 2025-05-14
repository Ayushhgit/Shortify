import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

from app.utils.downloader import VideoDownloader
from app.utils.analyzer import VideoAnalyzer
from app.utils.editor import VideoEditor
from app.models.schemas import VideoClipsResponse, ClipInfo
from app.core.config import settings

logger = logging.getLogger(__name__)

class ShortsService:
    @staticmethod
    async def generate_shorts(
        url: str,
        use_whisper: bool = False,
        use_gpt: bool = False
    ) -> Dict[str, Any]:
        """
        Generate short clips from YouTube video
        
        Args:
            url: YouTube video URL
            use_whisper: Whether to use Whisper for transcription
            use_gpt: Whether to use GPT-4 for analyzing virality
            
        Returns:
            Dictionary containing video ID and task information
        """
        # Start the task asynchronously to avoid timeout
        return {
            "url": url,
            "use_whisper": use_whisper,
            "use_gpt": use_gpt
        }
    
    @staticmethod
    async def process_video(
        url: str,
        use_whisper: bool = False,
        use_gpt: bool = False
    ) -> VideoClipsResponse:
        """
        Process video to generate short clips
        
        Args:
            url: YouTube video URL
            use_whisper: Whether to use Whisper for transcription
            use_gpt: Whether to use GPT-4 for analyzing virality
            
        Returns:
            VideoClipsResponse object
        """
        try:
            # Download the video
            video_id, video_path, video_info = await VideoDownloader.download_youtube(url)
            
            # Find viral segments
            segments = await VideoAnalyzer.find_viral_segments(
                video_path, use_whisper, use_gpt
            )
            
            # Create clips from segments
            clips = await VideoEditor.create_clips(video_path, segments)
            
            # Create response
            response = VideoClipsResponse(
                video_id=video_id,
                original_url=url,
                clips=clips,
                status="completed"
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing video: {e}")
            # Return error response
            return VideoClipsResponse(
                video_id="error",
                original_url=url,
                clips=[],
                status="failed"
            )
