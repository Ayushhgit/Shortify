# Resume Analyzer

from fastapi import APIRouter, UploadFile, File, Form
import os, shutil, json
from app.services.resume_parser import extract_text_from_pdf
from app.services.ai_resume_analyzer import analyze_resume

router = APIRouter()

@router.post("/analyze")
async def analyze(file: UploadFile = File(...), role: str = Form(...)):
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
