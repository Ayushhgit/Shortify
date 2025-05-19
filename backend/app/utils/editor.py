import os
import asyncio
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
        Extract a clip from a video using ffmpeg and convert to zoomed/cropped portrait (9:16)
        
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
        
        # Target portrait dimensions (9:16)
        target_height = 1280  # Standard portrait height
        target_width = int(target_height * 9 / 16)  # 720 for 1280 height
        
        # Optimization 1: Use better FFmpeg presets and flags
        cmd = [
            "ffmpeg", "-i", str(video_path),
            "-ss", start_str,  # Put -ss before -i for faster seeking
            "-t", str(duration),
            # Scale to fill height while maintaining aspect ratio, then crop to 9:16
            "-vf", f"scale=-1:{target_height}:flags=fast_bilinear,crop={target_width}:{target_height}",
            "-c:v", "libx264", "-c:a", "aac",
            # Optimization 2: Use ultrafast preset for initial processing (much faster with slight quality loss)
            "-preset", "ultrafast", 
            # Optimization 3: Add threading to improve performance
            "-threads", "0",  # Use all available threads
            "-y",
            str(output_path)
        ]
        
        try:
            # Run FFmpeg process
            proc = await asyncio.create_subprocess_exec(
                *cmd, 
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            _, stderr = await proc.communicate()
            
            if proc.returncode != 0:
                raise subprocess.CalledProcessError(proc.returncode, cmd, stderr=stderr)
            
            # Verify output dimensions 
            verify_cmd = [
                "ffprobe",
                "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=width,height",
                "-of", "csv=p=0",
                str(output_path)
            ]
            
            # Run FFprobe process
            probe_proc = await asyncio.create_subprocess_exec(
                *verify_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await probe_proc.communicate()
            dimensions = stdout.decode().strip()
            logger.info(f"Output video dimensions: {dimensions}")
            
            # Generate clip info
            clip_info = {
                "url": f"/uploads/clips/{output_path.name}",
                "start": VideoEditor.format_timestamp(start_time),
                "end": VideoEditor.format_timestamp(end_time),
                "confidence": 0.0,
                "caption": None,
            }
            
            return output_path, clip_info
            
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode() if hasattr(e, 'stderr') and e.stderr else str(e)
            logger.error(f"Error extracting clip: {error_msg}")
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
        # Optimization 4: Process clips concurrently
        tasks = []
        for start_time, end_time, confidence in segments:
            tasks.append(
                VideoEditor._process_clip(video_path, start_time, end_time, confidence)
            )
        
        # Wait for all clips to be processed concurrently
        clips = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and return valid clips
        return [clip for clip in clips if isinstance(clip, ClipInfo)]
    
    @staticmethod
    async def _process_clip(
        video_path: Path,
        start_time: float,
        end_time: float,
        confidence: float
    ) -> ClipInfo:
        """Helper method to process a single clip for concurrent processing"""
        try:
            clip_path, clip_info = await VideoEditor.extract_clip(
                video_path, start_time, end_time
            )
            
            # Update confidence score
            clip_info["confidence"] = confidence
            
            # Create ClipInfo object
            return ClipInfo(**clip_info)
        except Exception as e:
            logger.error(f"Error creating clip: {e}")
            # Re-raise to be handled by gather
            raise
    
    @staticmethod
    def format_timestamp(seconds: float) -> str:
        """Convert seconds to 'HH:MM:SS' format"""
        m, s = divmod(int(seconds), 60)
        h, m = divmod(m, 60)
        return f"{h:02d}:{m:02d}:{s:02d}"