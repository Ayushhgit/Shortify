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
        Extract a clip from a video using ffmpeg with ULTRAFAST settings
        """
        clip_id = str(uuid.uuid4())
        output_path = settings.CLIPS_DIR / f"{clip_id}.mp4"
        
        # Format timestamps
        start_str = VideoEditor.format_timestamp(start_time)
        duration = end_time - start_time
        
        # Target portrait dimensions (9:16)
        target_height = 1280 
        target_width = 720 
        
        # [OPTIMIZED] FFmpeg Command for Maximum Speed
        cmd = [
            "ffmpeg", 
            "-ss", start_str,       # Seek BEFORE input (Fast seeking)
            "-i", str(video_path),
            "-t", str(duration),    # Duration
            
            # Fast Scaling: Uses nearest neighbor or bilinear (much faster than bicubic)
            "-vf", f"scale=-2:{target_height}:flags=fast_bilinear,crop={target_width}:{target_height}",
            
            "-c:v", "libx264", 
            "-preset", "ultrafast", # <--- CRITICAL: Max speed
            "-tune", "zerolatency", # <--- CRITICAL: Low latency
            "-crf", "30",           # <--- CRITICAL: Lower quality slightly for 2x speed
            
            "-c:a", "aac", 
            "-b:a", "128k",         # Fixed audio bitrate is faster than VBR
            "-ac", "2",
            "-threads", "0",        # Use all CPU cores
            "-y",
            str(output_path)
        ]
        
        try:
            # Run FFmpeg
            proc = await asyncio.create_subprocess_exec(
                *cmd, 
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            _, stderr = await proc.communicate()
            
            if proc.returncode != 0:
                raise subprocess.CalledProcessError(proc.returncode, cmd, stderr=stderr)
            
            # Generate clip info
            clip_info = {
                "url": f"/uploads/clips/{output_path.name}",
                "start": start_str,
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
        """Create clips concurrently"""
        tasks = []
        for start_time, end_time, confidence in segments:
            tasks.append(
                VideoEditor._process_clip(video_path, start_time, end_time, confidence)
            )
        
        clips = await asyncio.gather(*tasks, return_exceptions=True)
        return [clip for clip in clips if isinstance(clip, ClipInfo)]
    
    @staticmethod
    async def _process_clip(
        video_path: Path,
        start_time: float,
        end_time: float,
        confidence: float
    ) -> ClipInfo:
        """Helper for concurrency"""
        try:
            clip_path, clip_info = await VideoEditor.extract_clip(
                video_path, start_time, end_time
            )
            clip_info["confidence"] = confidence
            return ClipInfo(**clip_info)
        except Exception as e:
            logger.error(f"Error creating clip: {e}")
            raise
    
    @staticmethod
    def format_timestamp(seconds: float) -> str:
        m, s = divmod(int(seconds), 60)
        h, m = divmod(m, 60)
        return f"{h:02d}:{m:02d}:{s:02d}"