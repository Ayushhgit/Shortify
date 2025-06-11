from typing import List, Optional, Dict, Any 
from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator
from enum import Enum
from datetime import datetime
import re
from dataclasses import dataclass

class TaskStatusEnum(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"

class SubscriptionTypeEnum(str, Enum):
    free = "free"
    pro = "pro"
    premium = "premium"

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
    subscription_type: Optional[SubscriptionTypeEnum] = SubscriptionTypeEnum.free

class UserUpdate(UserBase):
    is_active: Optional[bool] = None
    subscription_type: Optional[SubscriptionTypeEnum] = None

class UserOut(UserBase):
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    subscription_type: SubscriptionTypeEnum
    created_at: datetime
    email: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    subscription_type: SubscriptionTypeEnum
    
    class Config:
        from_attributes = True  # Changed from orm_mode = True

class CreateOrderRequest(BaseModel):
    order_id: str
    amount: int
    currency: str

class YouTubeRequest(BaseModel):
    url: str

class VideoDetails(BaseModel):
    title: str
    channelName: str
    duration: str
    publishDate: str
    thumbnailUrl: str

class YouTubeResponse(BaseModel):
    videoDetails: VideoDetails
    summary: str

class review(BaseModel):
    email: EmailStr
    rating: int
    review: Optional[str] = None

class ArticleRequest(BaseModel):
    url: HttpUrl

class ArticleDetails(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    publishDate: Optional[str] = None
    domain: Optional[str] = None
    readTime: Optional[int] = None

class ArticleResponse(BaseModel):
    summary: str
    articleDetails: ArticleDetails

class ArticleChatRequest(BaseModel):
    message: str
    article_content: Optional[str] = None
    article_url: Optional[str] = None

class ArticleChatResponse(BaseModel):
    response: str
    timestamp: str
    source_info: Optional[Dict[str, Any]] = None

class BatchChatMessage(BaseModel):
    message: str
    timestamp: Optional[str] = None

class BatchArticleChatRequest(BaseModel):
    messages: List[BatchChatMessage]
    article_content: str

class BatchArticleChatResponse(BaseModel):
    responses: List[Dict[str, Any]]
    total_processed: int

class SimpleChatRequest(BaseModel):
    message: str
    article_content: str
    article_url: Optional[str] = None

class SimpleChatResponse(BaseModel):
    response: str
    timestamp: str
    article_url: Optional[str] = None

class CoverLetterRequest(BaseModel):
    resume: str
    job: str
    tone: str = "professional"
    company: str
    role: str

class CoverLetterResponse(BaseModel):
    success: bool
    cover_letter: Optional[str] = None
    message: Optional[str] = None

class ResumeExtractionResponse(BaseModel):
    success: bool
    text: Optional[str] = None
    message: Optional[str] = None 

# Review Schemas
class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating must be between 1 and 5")
    feedback: Optional[str] = Field(None, max_length=500, description="Feedback text")

class ReviewCreate(ReviewBase):
    email: EmailStr

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    feedback: Optional[str] = Field(None, max_length=500)

class ReviewResponse(ReviewBase):
    id: int
    email: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Changed from orm_mode = True

class ReviewWithUser(ReviewResponse):
    user: UserResponse

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
class UserQuery(BaseModel):
    message: str

class AgentResponse(BaseModel):
    reply: str