import os
from pathlib import Path
import subprocess
import uuid
import logging
from typing import List, Tuple, Dict, Any

from app.core.config import settings
from app.models.schemas import ClipInfo

logger = logging.getLogger(__name__)

class VideoEditor:
    @staticmethod
    async def extract_clip(
        video_path: Path,
        start_time: float,
        end_time: float
    ) -> Tuple[Path, Dict[str, Any]]:
        """
        Extract a clip from a video using ffmpeg
        
        Args:
            video_path: Path to the video file
            start_time: Start time in seconds
            end_time: End time in seconds
            
        Returns:
            Tuple of (output_path, clip_info)
        """
        clip_id = str(uuid.uuid4())
        output_path = settings.CLIPS_DIR / f"{clip_id}.mp4"
        
        # Format timestamps for ffmpeg
        start_str = VideoEditor.format_timestamp(start_time)
        duration = end_time - start_time
        
        cmd = [
            "ffmpeg", "-i", str(video_path),
            "-ss", start_str,
            "-t", str(duration),
            "-c:v", "libx264", "-c:a", "aac",
            "-preset", "fast", "-y",
            str(output_path)
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Generate clip info
            clip_info = {
                "url": f"/uploads/clips/{output_path.name}",
                "start": VideoEditor.format_timestamp(start_time),
                "end": VideoEditor.format_timestamp(end_time),
                "confidence": 0.0,  # Will be updated later
            }
            
            return output_path, clip_info
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Error extracting clip: {e}")
            # Clean up any partial files
            if os.path.exists(output_path):
                os.remove(output_path)
            raise
    
    @staticmethod
    async def create_clips(
        video_path: Path, 
        segments: List[Tuple[float, float, float]]
    ) -> List[ClipInfo]:
        """
        Create clips from segments
        
        Args:
            video_path: Path to the video file
            segments: List of segments with (start_time, end_time, confidence)
            
        Returns:
            List of ClipInfo objects
        """
        clips = []
        
        for start_time, end_time, confidence in segments:
            try:
                clip_path, clip_info = await VideoEditor.extract_clip(
                    video_path, start_time, end_time
                )
                
                # Update confidence score
                clip_info["confidence"] = confidence
                
                # Create ClipInfo object
                clips.append(ClipInfo(**clip_info))
                
            except Exception as e:
                logger.error(f"Error creating clip: {e}")
                # Continue with other clips
                continue
        
        return clips
    
    @staticmethod
    def format_timestamp(seconds: float) -> str:
        """Convert seconds to 'HH:MM:SS' format"""
        m, s = divmod(int(seconds), 60)
        h, m = divmod(m, 60)
        return f"{h:02d}:{m:02d}:{s:02d}"
