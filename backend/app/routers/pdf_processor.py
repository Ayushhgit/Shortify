# pdf_processor.py
from fastapi import APIRouter, UploadFile, HTTPException
from typing import List
import uuid
import PyPDF2
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import os
import io

router = APIRouter(prefix="/pdf", tags=["PDF Processing"])

@router.post("/upload")
async def upload_pdf(file: UploadFile):
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset pointer
    
    if file_size > max_size:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")
    
    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are accepted.")
    
    # Save the file temporarily
    temp_path = f"uploads/temp_{uuid.uuid4()}.pdf"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())
    
    try:
        # Try text extraction
        try:
            questions = extract_text_from_pdf(temp_path)
        except Exception as e:
            # Fallback to OCR if text extraction fails
            questions = extract_text_with_ocr(temp_path)
        
        return {"questions": questions, "session_id": str(uuid.uuid4())}
    finally:
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)

def extract_text_from_pdf(pdf_path: str) -> List[str]:
    questions = []
    
    # Try with pdfplumber first (better for text extraction)
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    questions.extend(identify_questions(text))
        return questions
    except:
        pass
    
    # Fallback to PyPDF2
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text = page.extract_text()
            if text:
                questions.extend(identify_questions(text))
    
    return questions

def extract_text_with_ocr(pdf_path: str) -> List[str]:
    questions = []
    images = convert_from_path(pdf_path)
    
    for img in images:
        text = pytesseract.image_to_string(img)
        if text:
            questions.extend(identify_questions(text))
    
    return questions

def identify_questions(text: str) -> List[str]:
    # This is a simplified version - would need more sophisticated parsing
    import re
    
    # Common question patterns
    patterns = [
        r'(?:Q|Question)\s?\d+[.:]\s?(.*?)(?=(?:\n\s*(?:Q|Question)\s?\d+[.:]|$))',
        r'\d+[.)]\s?(.*?)(?=(?:\n\s*\d+[.)]|$))',
        r'\([a-z]\)\s?(.*?)(?=(?:\n\s*\([a-z]\)|$))'
    ]
    
    questions = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                match = match[0]  # Take the first group if it's a tuple
            if match.strip():
                questions.append(match.strip())
    
    return questions if questions else [text]  # Fallback to entire text if no questions found