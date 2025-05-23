from typing import List, Optional
from pydantic import BaseModel, EmailStr, HttpUrl, field_validator
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

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    firebase_uid: str

class UserUpdate(UserBase):
    is_active: Optional[bool] = None

class UserOut(UserBase):
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    created_at: datetime

class UserResponse(UserBase):
    id: int
    is_active: bool
    
    class Config:
        orm_mode = True

class CreateOrderRequest(BaseModel):
    order_id: str
    amount: int
    currency: str