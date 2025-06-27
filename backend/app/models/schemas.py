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
    usage_info: Optional[dict] = None

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
    usage_info: Optional[dict] = None

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

class ImportanceLevel(str, Enum):
    high = "High"
    medium = "Medium" 
    low = "Low"

class QuestionDifficulty(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"

class InterviewQuestionType(str, Enum):
    behavioral = "Behavioral"
    technical = "Technical"
    situational = "Situational"


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="The research query")
    
    @field_validator('query')
    def validate_query(cls, v):
        if not v or not v.strip():
            raise ValueError('Query cannot be empty or just whitespace')
        return v.strip()

class ResearchResponse(BaseModel):
    topic: str = Field(..., description="The main topic of research")
    summary: str = Field(..., description="Comprehensive summary of research findings")
    sources: List[str] = Field(default_factory=list, description="List of sources used")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="When the research was conducted")
    usage_info: Optional[dict] = None
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: datetime = Field(default_factory=datetime.now, description="When the error occurred")

class HealthResponse(BaseModel):
    status: str = Field(..., description="Service status")
    service: str = Field(..., description="Service name")
    timestamp: datetime = Field(default_factory=datetime.now, description="Health check timestamp")

class DifficultyLevel(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"

class QuestionType(str, Enum):
    mcq = "mcq"
    qna = "qna"
    numerical = "numerical"

class QuizRequest(BaseModel):
    num_questions: int = Field(ge=1, le=50, description="Number of questions to generate")
    difficulty: DifficultyLevel = Field(description="Difficulty level of questions")
    topic: str = Field(min_length=1, max_length=500, description="Topic or context for the questions")
    question_types: List[QuestionType] = Field(min_items=1, description="Types of questions to generate")
    
    @field_validator('topic')
    def validate_topic(cls, v):
        if not v.strip():
            raise ValueError('Topic cannot be empty')
        return v.strip()

class Question(BaseModel):
    type: str
    question: str
    options: Optional[List[str]] = None
    answer: str
    explanation: Optional[str] = None

class QuizResponse(BaseModel):
    questions: List[Question]
    topic: str
    difficulty: str
    total_questions: int
    generated_at: str

class VideoRequest(BaseModel):
    topic: str

class InterviewPrepRequest(BaseModel):
    """Request model for interview preparation analysis"""
    resume_text: Optional[str] = None
    job_text: Optional[str] = None
    company: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=100)

class SkillMatch(BaseModel):
    """Model for skill matching analysis"""
    skill: str
    match: int = Field(..., ge=0, le=100)
    description: str

class SkillGap(BaseModel):
    skill: str
    importance: ImportanceLevel 
    suggestion: str

class InterviewFocusArea(BaseModel):
    """Model for interview focus areas"""
    area: str
    why: str
    preparation_tip: str

class PotentialConcern(BaseModel):
    """Model for potential interview concerns"""
    concern: str
    how_to_address: str

class InterviewAnalysisResponse(BaseModel):
    overall_match: int = Field(..., ge=0, le=100)
    strengths: List[SkillMatch]  
    gaps: List[SkillGap]        
    key_words: List[str]
    interview_focus_areas: List[InterviewFocusArea]
    unique_selling_points: List[str]
    potential_concerns: List[PotentialConcern]
    session_id: Optional[str] = None
    usage_info: Optional[Dict[str, Any]] = None

class InterviewQuestion(BaseModel):
    id: int
    type: InterviewQuestionType  # Use enum
    question: str
    framework: str
    sample_answer: str
    difficulty: QuestionDifficulty  # Use enum
    focus_area: str
    preparation_tips: List[str]

class InterviewQuestionsResponse(BaseModel):
    """Response model for interview questions"""
    questions: List[InterviewQuestion]
    general_tips: List[str]
    usage_info: Optional[Dict[str, Any]] = None

class ChatMessage(BaseModel):
    """Model for chat messages"""
    message: str = Field(..., min_length=1, max_length=1000)
    timestamp: Optional[datetime] = None

class ChatResponse(BaseModel):
    """Response model for AI chat"""
    response: str
    session_id: str
    usage_info: Optional[Dict[str, Any]] = None

class InterviewSession(BaseModel):
    """Model for interview preparation session"""
    session_id: str
    user_id: str
    company: str
    role: str
    created_at: datetime
    resume_content: Optional[str] = None
    job_content: Optional[str] = None
    analysis: Optional[InterviewAnalysisResponse] = None
    chat_history: List[Dict[str, Any]] = []

class InterviewSessionSummary(BaseModel):
    """Model for session summary in list view"""
    session_id: str
    company: str
    role: str
    created_at: str

class ProfileScore(BaseModel):
    score: int
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    usage_info: Optional[Dict[str, Any]] = None

class GeneratedContent(BaseModel):
    headlines: List[str]
    about_sections: List[str]
    posts: List[str]
    usage_info: Optional[Dict[str, Any]] = None