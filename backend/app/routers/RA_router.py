# --- app/routers/resume.py ---
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
import os, shutil, json

from app.services.resume_parser import extract_text_from_pdf
from app.services.ai_resume_analyzer import analyze_resume
from app.core.security import get_current_user
from app.core.rate_limiting import resume_analysis_rate_limit

router = APIRouter()

@router.post("/analyze")
async def analyze_resume_route(
    file: UploadFile = File(...),
    role: str = Form(...),
    current_user: dict = Depends(get_current_user),
    rate_limit_data: dict = Depends(resume_analysis_rate_limit)
):
    try:
        user = rate_limit_data['user']
        rate_info = rate_limit_data['rate_limit_info']
        
        # Create temp directory
        os.makedirs("temp", exist_ok=True)
        temp_path = f"temp/{file.filename}"
        
        # Save uploaded file
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        try:
            # Extract text and analyze
            text = extract_text_from_pdf(temp_path)
            gpt_response = analyze_resume(text, role)
            
            # Parse response
            if isinstance(gpt_response, dict):
                result = gpt_response
            else:
                try:
                    result = json.loads(gpt_response)
                except json.JSONDecodeError as e:
                    result = {
                        "error": "Invalid JSON from LLM",
                        "raw": gpt_response,
                        "exception": str(e)
                    }
            
            # Add usage info to response
            result["usage_info"] = {
                "remaining": rate_info['remaining'],
                "limit": rate_info['limit'],
                "subscription": rate_info['subscription']
            }
            
            return result
            
        finally:
            # Always clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze resume: {str(e)}"
        )
