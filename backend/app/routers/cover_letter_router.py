from fastapi import APIRouter, HTTPException
from app.models.schemas import CoverLetterRequest, CoverLetterResponse
import logging
from app.services.rcover_letter import COVER_LETTER_PROMPT, llm


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
@router.post("/generate-cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(request: CoverLetterRequest):
    """Generate a personalized cover letter using AI"""
    try:
        # Validate input
        if not all([request.resume.strip(), request.job.strip(), request.company.strip(), request.role.strip()]):
            raise HTTPException(status_code=400, detail="All fields (resume, job, company, role) are required")
        
        # Prepare the prompt
        prompt = COVER_LETTER_PROMPT.format_messages(
            company=request.company,
            role=request.role,
            tone=request.tone,
            resume=request.resume,
            job_description=request.job
        )
        
        # Generate cover letter using Groq
        logger.info(f"Generating cover letter for {request.role} at {request.company}")
        response = llm.invoke(prompt)
        
        cover_letter = response.content.strip()
        
        if not cover_letter:
            raise HTTPException(status_code=500, detail="Failed to generate cover letter content")
        
        logger.info("Cover letter generated successfully")
        return CoverLetterResponse(
            success=True,
            cover_letter=cover_letter,
            message="Cover letter generated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating cover letter: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate cover letter: {str(e)}")