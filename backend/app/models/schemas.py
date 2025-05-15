from typing import List, Optional
from pydantic import BaseModel, HttpUrl, field_validator
from enum import Enum
from datetime import datetime
import re

class TaskStatusEnum(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"

class VideoGenerateRequest(BaseModel):
    url: HttpUrl
    use_whisper: Optional[bool] = False
    use_gpt: Optional[bool] = False

    @field_validator('url')
    def validate_youtube_url(cls, v):
        youtube_pattern = re.compile(
            r'^(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[\w-]{11}.*$'
        )
        if not youtube_pattern.match(str(v)):
            raise ValueError("URL must be a valid YouTube video link")
        return v

class ClipInfo(BaseModel):
    url: str
    start: str  # Format: "HH:MM:SS"
    end: str    # Format: "HH:MM:SS"
    confidence: float
    caption: Optional[str] = None

    @field_validator('start', 'end')
    def validate_time_format(cls, v):
        try:
            datetime.strptime(v, "%H:%M:%S")
        except ValueError:
            raise ValueError("Time must be in HH:MM:SS format")
        return v

class VideoClipsResponse(BaseModel):
    video_id: str
    original_url: str
    clips: List[ClipInfo]
    task_id: Optional[str] = None
    status: TaskStatusEnum = TaskStatusEnum.completed

class TaskStatusResponse(BaseModel):
    task_id: str
    status: TaskStatusEnum
    progress: Optional[float] = None
    result: Optional[VideoClipsResponse] = None
