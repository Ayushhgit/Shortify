# --- app/routers/resume.py ---
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
import os, shutil, json

from app.services.resume_parser import extract_text_from_pdf
from app.services.ai_resume_analyzer import analyze_resume
from app.core.security import get_current_user

router = APIRouter()

@router.post("/analyze")
async def analyze_resume_route(
    file: UploadFile = File(...),
    role: str = Form(...),
    current_user: dict = Depends(get_current_user),  # 🔐 Require login
):
    try:
        os.makedirs("temp", exist_ok=True)
        temp_path = f"temp/{file.filename}"

        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        text = extract_text_from_pdf(temp_path)
        os.remove(temp_path)

        gpt_response = analyze_resume(text, role)

        if isinstance(gpt_response, dict):
            return gpt_response

        try:
            parsed = json.loads(gpt_response)
            return parsed
        except Exception as e:
            return {
                "error": "Invalid JSON from LLM",
                "raw": gpt_response,
                "exception": str(e)
            }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing resume: {str(e)}"
        )
