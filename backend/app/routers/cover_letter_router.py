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
        # Logging input details
        logger.info(f"Received request - Company: {request.company}, Role: {request.role}")
        logger.info(f"Resume length: {len(request.resume) if request.resume else 0}")
        logger.info(f"Job description length: {len(request.job) if request.job else 0}")
        logger.info(f"Tone: {request.tone}")

        # Input validation
        if not all([
            request.resume and request.resume.strip(),
            request.job and request.job.strip(),
            request.company and request.company.strip(),
            request.role and request.role.strip()
        ]):
            raise HTTPException(status_code=422, detail="All fields (resume, job, company, role) are required")

        # Prepare the prompt
        prompt = COVER_LETTER_PROMPT.format_messages(
            company=request.company,
            role=request.role,
            tone=request.tone,
            resume=request.resume,
            job_description=request.job
        )

        # Generate cover letter using LLM
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
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
