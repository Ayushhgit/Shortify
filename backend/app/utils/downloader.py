import os
import uuid
import asyncio
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import yt_dlp
import logging
from datetime import timedelta

from app.core.config import settings

logger = logging.getLogger(__name__)

class VideoDownloader:
    @staticmethod
    async def download_youtube(
        url: str,
        format: Optional[str] = None,
        max_filesize: Optional[str] = None,
        max_duration: Optional[int] = None,
        download_thumbnail: bool = True
    ) -> Tuple[str, Path, Dict[str, Any]]:
        """
        Download a YouTube video and save it locally with metadata
        """
        if not url or ('youtube.com' not in url and 'youtu.be' not in url):
            raise ValueError("Invalid YouTube URL")

        video_id = str(uuid.uuid4())
        video_path = settings.ORIGINALS_DIR / f"{video_id}.mp4"
        thumbnail_path = settings.ORIGINALS_DIR / f"{video_id}.jpg" if download_thumbnail else None

        video_path.parent.mkdir(parents=True, exist_ok=True)

        # Fixed postprocessor configuration
        ydl_opts = {
        'format': format or 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': str(video_path),
        'noplaylist': True,
        'quiet': True,
        'merge_output_format': 'mp4',
        'no_warnings': False,
        'writethumbnail': download_thumbnail,
    
        # ✅ Spoof real browser headers
        'add_header': [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language: en-US,en;q=0.9'
        ],
    
        'cookies': 'cookies.txt',  # path to your exported YouTube cookies

        # ✅ Postprocessors for thumbnail if needed
        'postprocessors': [
        *(
            [{'key': 'FFmpegThumbnailsConvertor', 'format': 'jpg'}]
            if download_thumbnail else []
        )
        ],

        # ✅ Retry logic 
        'retries': 3,
        'fragment_retries': 3,
        'sleep_interval': 2,
        'max_sleep_interval': 5
        }   

        if max_filesize:
            ydl_opts['max_filesize'] = max_filesize
        if max_duration:
            ydl_opts['max_duration'] = max_duration

        try:
            def sync_download():
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    return ydl.sanitize_info(info)

            video_info = await asyncio.to_thread(sync_download)

            if not video_path.exists():
                raise FileNotFoundError(f"Downloaded video not found at {video_path}")

            if video_path.stat().st_size == 0:
                video_path.unlink()
                if thumbnail_path and thumbnail_path.exists():
                    thumbnail_path.unlink()
                raise ValueError("Downloaded video file is empty")

            processed_info = {
                'id': video_info.get('id'),
                'title': video_info.get('title', 'Untitled'),
                'duration': timedelta(seconds=video_info.get('duration', 0)),
                'uploader': video_info.get('uploader', 'Unknown'),
                'upload_date': video_info.get('upload_date', None),
                'view_count': video_info.get('view_count', 0),
                'thumbnail': str(thumbnail_path) if thumbnail_path and thumbnail_path.exists() else None,
                'resolution': video_info.get('resolution', 'unknown'),
                'fps': video_info.get('fps', 0),
                'filesize': video_path.stat().st_size,
                'original_url': url
            }

            logger.info(
                f"Downloaded video {video_id} ({processed_info['title']}) "
                f"Duration: {processed_info['duration']}, "
                f"Size: {processed_info['filesize']} bytes"
            )

            return video_id, video_path, processed_info

        except yt_dlp.DownloadError as e:
            logger.error(f"YouTube download failed: {str(e)}")
            if video_path.exists():
                video_path.unlink()
            if thumbnail_path and thumbnail_path.exists():
                thumbnail_path.unlink()
            raise RuntimeError(f"Failed to download video: {str(e)}")

        except Exception as e:
            logger.error(f"Unexpected error downloading video: {str(e)}")
            if video_path.exists():
                video_path.unlink()
            if thumbnail_path and thumbnail_path.exists():
                thumbnail_path.unlink()
            raise RuntimeError(f"Video download failed: {str(e)}")

    @staticmethod
    async def cleanup_files(video_id: str) -> None:
        base_path = settings.ORIGINALS_DIR / video_id
        video_file = base_path.with_suffix('.mp4')
        thumb_file = base_path.with_suffix('.jpg')

        try:
            if video_file.exists():
                video_file.unlink()
            if thumb_file.exists():
                thumb_file.unlink()
        except Exception as e:
            logger.error(f"Error cleaning up files for {video_id}: {str(e)}")
            raise
