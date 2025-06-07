from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import logging
from app.models.schemas import ResumeExtractionResponse
from app.services.rcover_letter import extract_text_from_doc, extract_text_from_docx, extract_text_from_pdf, extract_text_from_txt

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/extract-resume", response_model=ResumeExtractionResponse)
async def extract_resume(file: UploadFile = File(...)):
    """Extract text content from uploaded resume file"""
    try:
        # Validate file type
        allowed_types = {
            "application/pdf": extract_text_from_pdf,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": extract_text_from_docx,
            "application/msword": extract_text_from_doc,
            "text/plain": extract_text_from_txt
        }
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {file.content_type}. Supported types: PDF, DOCX, DOC, TXT"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Validate file size (5MB limit)
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Extract text based on file type
        extract_function = allowed_types[file.content_type]
        extracted_text = extract_function(file_content)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text content found in the uploaded file")
        
        logger.info(f"Successfully extracted text from {file.filename}")
        return ResumeExtractionResponse(
            success=True,
            text=extracted_text,
            message="Resume processed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing resume: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error processing the resume")