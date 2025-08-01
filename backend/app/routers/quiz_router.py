from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import QuizResponse, QuizRequest,QuestionType, DifficultyLevel, TaskStatusResponse
from dotenv import load_dotenv
import logging
from app.services.quiz_service import GroqAPIClient, QuizGenerator
import os
from app.core.rate_limiting import quiz_generation_rate_limit

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_QUIZ_KEY")

groq_client = GroqAPIClient(GROQ_API_KEY) if GROQ_API_KEY else GroqAPIClient("")
quiz_generator = QuizGenerator(groq_client)

router = APIRouter(prefix="/quiz", tags=["Quiz Generator"])

@router.get("/")
async def root():
    return {
        "message": "Shortify Quiz Generator API", 
        "version": "1.0.0",
        "powered_by": "Groq Cloud API",
        "status": "running"
    }

@router.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "quiz-generator",
        "groq_api_configured": bool(GROQ_API_KEY)
    }

@router.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(
    request: QuizRequest,
    rate_limit_data: dict = Depends(quiz_generation_rate_limit)
    ):
    """Generate a quiz based on the provided parameters"""
    try:
        user = rate_limit_data['user']
        rate_info = rate_limit_data['rate_limit_info']

        logger.info(f"Generating quiz: {request.num_questions} questions about '{request.topic}' at {request.difficulty} level")
        quiz = await quiz_generator.generate_quiz(request)
        logger.info(f"Successfully generated {quiz.total_questions} questions")
        return quiz
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")

@router.get("/question-types")
async def get_question_types():
    """Get available question types"""
    return {
        "question_types": [
            {
                "id": "mcq", 
                "name": "Multiple Choice", 
                "description": "Questions with 4 options and one correct answer",
                "icon": "check-circle"
            },
            {
                "id": "qna", 
                "name": "Question & Answer", 
                "description": "Open-ended questions with detailed explanations",
                "icon": "file-text"
            },
            {
                "id": "numerical", 
                "name": "Numerical", 
                "description": "Mathematical problems with step-by-step solutions",
                "icon": "calculator"
            }
        ]
    }

@router.get("/difficulty-levels")
async def get_difficulty_levels():
    """Get available difficulty levels"""
    return {
        "difficulty_levels": [
            {
                "id": "easy", 
                "name": "Easy", 
                "description": "Basic concepts and simple recall questions",
                "color": "green"
            },
            {
                "id": "medium", 
                "name": "Medium", 
                "description": "Applied knowledge and analytical thinking",
                "color": "yellow"
            },
            {
                "id": "hard", 
                "name": "Hard", 
                "description": "Complex analysis and advanced problem-solving",
                "color": "red"
            }
        ]
    }

@router.get("/api-status")
async def api_status():
    """Check API configuration status"""
    return {
        "groq_api_configured": bool(GROQ_API_KEY),
        "mock_mode": not bool(GROQ_API_KEY),
        "message": "Configure GROQ_API_KEY environment variable to use real AI generation" if not GROQ_API_KEY else "Groq API ready"
    }

@router.post("/test-question")
async def test_question_generation(
    question_type: QuestionType, 
    topic: str = "Python programming", 
    difficulty: DifficultyLevel = DifficultyLevel.medium
):
    """Test endpoint to generate a single question"""
    try:
        questions = await quiz_generator.generate_questions_for_type(
            question_type, topic, difficulty, 1
        )
        
        if questions:
            return {"success": True, "question": questions[0]}
        else:
            return {"success": False, "message": "No questions generated"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing question generation: {str(e)}")
