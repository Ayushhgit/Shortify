from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional, Union
from pydantic import BaseModel, Field
import os
import logging
import tempfile
import base64
from io import BytesIO
import re
import json

# LangChain and Groq imports
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate

# File processing imports
import PyPDF2
from PIL import Image
import pytesseract
from docx import Document

router = APIRouter(prefix="/ai", tags=["AI Solution Generation"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get Groq API key from environment
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY environment variable not set")
    raise ValueError("GROQ_API_KEY environment variable must be set")

# Initialize Groq LLM
llm = ChatGroq(
    temperature=0.7,
    groq_api_key=GROQ_API_KEY,
    model_name="llama3-8b-8192"  
)

# Request models
class AssignmentRequest(BaseModel):
    questions: List[str] = Field(..., min_length=1, description="List of questions to process")
    subject: str = Field(default="general", description="Subject area for the questions")

class FileAssignmentRequest(BaseModel):
    subject: str = Field(default="general", description="Subject area")
    file_content: str = Field(..., description="Base64 encoded file content or plain text")
    file_type: str = Field(..., description="File type (pdf, docx, jpg, etc.)")

class TextOnlyRequest(BaseModel):
    question: str = Field(..., description="Single question text")
    subject: str = Field(default="general", description="Subject area")

# Subject-specific prompts
SUBJECT_PROMPTS = {
    "math": "Provide a step-by-step solution to the following math problem. Explain each step clearly and show all calculations. Use mathematical notation where appropriate.",
    "science": "Answer the following science question comprehensively. Include relevant concepts, formulas, and examples where applicable. If the question involves diagrams, describe them in detail.",
    "history": "Provide a detailed answer to this history question. Include important dates, events, and historical context. Explain the significance of key elements.",
    "literature": "Analyze this literature question. Include relevant quotes, themes, and literary devices. Provide interpretations and critical analysis.",
    "general": "Answer the following question in a clear, student-friendly manner. Provide comprehensive information with examples where appropriate."
}

# Create prompt template for AI solver
AI_SOLVER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful and knowledgeable tutor that provides detailed, accurate answers to student questions. 
    Your goal is to help students understand concepts by providing clear explanations, step-by-step solutions, and relevant examples.

    Guidelines:
    1. Provide comprehensive and accurate answers
    2. Break down complex problems into manageable steps
    3. Use clear, student-friendly language
    4. Include examples and explanations where helpful
    5. Show all calculations and reasoning
    6. Encourage learning and understanding rather than just giving answers
    7. Be encouraging and supportive in your tone
    8. Structure your response with clear sections and bullet points where appropriate
    9. If solving math problems, show each step clearly"""),
    
    ("human", """{subject_prompt}

Question: {question}

Please provide a detailed and helpful answer that will help the student understand the concept and solution.""")
])

# File processing functions
def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(file_content)
            temp_file.flush()
            temp_filename = temp_file.name

        try:
            with open(temp_filename, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                text = ""
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                return text.strip()
        finally:
            os.unlink(temp_filename)
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        return f"Error processing PDF file: {str(e)}"

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        with tempfile.NamedTemporaryFile() as temp_file:
            temp_file.write(file_content)
            temp_file.flush()
            
            doc = Document(temp_file.name)
            text = ""
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text += paragraph.text + "\n"
            return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {str(e)}")
        return f"Error processing DOCX file: {str(e)}"

def extract_text_from_image(file_content: bytes) -> str:
    """Extract text from image using OCR"""
    try:
        image = Image.open(BytesIO(file_content))
        # Use pytesseract to extract text
        text = pytesseract.image_to_string(image)
        return text.strip() if text.strip() else "No text found in image"
    except Exception as e:
        logger.error(f"Error extracting text from image: {str(e)}")
        return f"Error processing image file: {str(e)}"

def process_ai_response(ai_response: str) -> dict:
    """Process AI response and extract structured information"""
    lines = [line.strip() for line in ai_response.split('\n') if line.strip()]
    
    # Extract steps (lines that start with numbers or bullet points)
    steps = []
    key_points = []
    
    for line in lines:
        if re.match(r'^\d+\.', line) or line.startswith('•') or line.startswith('-'):
            steps.append(line)
        elif len(line) > 20 and not line.endswith(':'):  # Likely a key point
            key_points.append(line)
    
    # If no structured steps found, create them from paragraphs
    if not steps and len(lines) > 1:
        steps = lines[:5]  # First 5 lines as steps
    
    # Generate key points if none found
    if not key_points:
        key_points = ["AI-generated comprehensive solution", "Step-by-step explanation provided", "Detailed analysis included"]
    
    return {
        "steps": steps[:10],  # Limit to 10 steps
        "key_points": key_points[:5],  # Limit to 5 key points
        "full_response": ai_response
    }

@router.post("/generate-solutions")
async def generate_solutions(request: AssignmentRequest):
    """Enhanced endpoint for text-based questions"""
    try:
        logger.info(f"Received request: {request}")
        
        if not request.questions or len(request.questions) == 0:
            raise HTTPException(status_code=400, detail="No questions provided")
        
        if request.subject not in SUBJECT_PROMPTS:
            request.subject = "general"
        
        subject_prompt = SUBJECT_PROMPTS[request.subject]
        solutions = []
        
        for question in request.questions:
            if not question or not question.strip():
                continue
                
            try:
                logger.info(f"Processing question: {question[:100]}...")
                
                # Create the prompt
                formatted_prompt = AI_SOLVER_PROMPT.format_messages(
                    subject_prompt=subject_prompt,
                    question=question.strip()
                )
                
                # Get response from Groq LLM
                response = llm.invoke(formatted_prompt)
                ai_answer = response.content
                
                # Process the response
                processed_response = process_ai_response(ai_answer)
                
                solution = {
                    "question": question,
                    "answer": ai_answer,
                    "subject": request.subject,
                    "steps": processed_response["steps"],
                    "key_points": processed_response["key_points"],
                    "confidence": 95,
                    "explanation": ai_answer
                }
                
                solutions.append(solution)
                logger.info(f"Successfully processed question")
            
            except Exception as e:
                logger.error(f"Error processing individual question: {str(e)}")
                solutions.append({
                    "question": question,
                    "answer": f"Sorry, I encountered an error processing this question: {str(e)}",
                    "subject": request.subject,
                    "error": True,
                    "steps": [],
                    "key_points": [],
                    "confidence": 0,
                    "explanation": f"Error: {str(e)}"
                })
        
        return {"solutions": solutions}
    
    except Exception as e:
        logger.error(f"AI generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@router.post("/upload-and-solve")
async def upload_and_solve(
    file: UploadFile = File(...),
    subject: str = Form("general")
):
    """Endpoint for file uploads"""
    try:
        logger.info(f"Processing file upload: {file.filename}, content_type: {file.content_type}")
        
        # Validate file size
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        file_content = await file.read()
        
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
        
        # Extract text based on file type
        extracted_text = ""
        
        # Try by content type first
        if file.content_type == "application/pdf":
            extracted_text = extract_text_from_pdf(file_content)
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            extracted_text = extract_text_from_docx(file_content)
        elif file.content_type and file.content_type.startswith("image/"):
            extracted_text = extract_text_from_image(file_content)
        else:
            # Fallback to file extension
            file_extension = ""
            if file.filename:
                file_extension = file.filename.lower().split('.')[-1]
            
            if file_extension == "pdf":
                extracted_text = extract_text_from_pdf(file_content)
            elif file_extension in ["docx", "doc"]:
                extracted_text = extract_text_from_docx(file_content)
            elif file_extension in ["jpg", "jpeg", "png", "bmp", "tiff", "gif"]:
                extracted_text = extract_text_from_image(file_content)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type or 'unknown'}")
        
        if not extracted_text or extracted_text.startswith("Error"):
            raise HTTPException(status_code=400, detail=extracted_text or "Could not extract text from file")
        
        logger.info(f"Extracted text length: {len(extracted_text)}")
        
        # Process the extracted text
        if subject not in SUBJECT_PROMPTS:
            subject = "general"
        
        subject_prompt = SUBJECT_PROMPTS[subject]
        
        # Enhanced prompt for file content
        enhanced_question = f"""The following content was extracted from a file ({file.filename}). 
Please analyze this content and provide helpful solutions, explanations, or answers to any questions contained within.
If there are multiple questions, address each one systematically.

Extracted content:
{extracted_text}"""
        
        # Create the prompt
        formatted_prompt = AI_SOLVER_PROMPT.format_messages(
            subject_prompt=subject_prompt,
            question=enhanced_question
        )
        
        # Get response from Groq LLM
        response = llm.invoke(formatted_prompt)
        ai_answer = response.content
        
        # Process the response
        processed_response = process_ai_response(ai_answer)
        
        solution = {
            "question": f"Content from file: {file.filename}",
            "extracted_text": extracted_text,
            "answer": ai_answer,
            "subject": subject,
            "steps": processed_response["steps"],
            "key_points": processed_response["key_points"],
            "confidence": 95,
            "explanation": ai_answer,
            "file_info": {
                "filename": file.filename,
                "content_type": file.content_type,
                "size_bytes": len(file_content)
            }
        }
        
        return {"solutions": [solution]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

@router.post("/text-only")
async def text_only_solution(request: TextOnlyRequest):
    """Simple endpoint for single text questions"""
    try:
        logger.info(f"Processing text-only request: {request.question[:100]}...")
        
        if not request.question or not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        if request.subject not in SUBJECT_PROMPTS:
            request.subject = "general"
        
        subject_prompt = SUBJECT_PROMPTS[request.subject]
        
        # Create the prompt
        formatted_prompt = AI_SOLVER_PROMPT.format_messages(
            subject_prompt=subject_prompt,
            question=request.question.strip()
        )
        
        # Get response from Groq LLM
        response = llm.invoke(formatted_prompt)
        ai_answer = response.content
        
        # Process the response
        processed_response = process_ai_response(ai_answer)
        
        solution = {
            "question": request.question,
            "answer": ai_answer,
            "subject": request.subject,
            "steps": processed_response["steps"],
            "key_points": processed_response["key_points"],
            "confidence": 95,
            "explanation": ai_answer
        }
        
        return {"solutions": [solution]}
        
    except Exception as e:
        logger.error(f"Text processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Text processing failed: {str(e)}")

# Alternative endpoint for base64 encoded files
@router.post("/process-file-content")
async def process_file_content(request: FileAssignmentRequest):
    """Process file content sent as base64 string"""
    try:
        logger.info(f"Processing file content, type: {request.file_type}")
        
        # Handle both base64 and plain text
        extracted_text = ""
        
        if request.file_type.lower() in ["pdf", "docx", "doc", "jpg", "jpeg", "png", "bmp", "tiff"]:
            try:
                # Try to decode as base64
                file_content = base64.b64decode(request.file_content)
                
                if request.file_type.lower() == "pdf":
                    extracted_text = extract_text_from_pdf(file_content)
                elif request.file_type.lower() in ["docx", "doc"]:
                    extracted_text = extract_text_from_docx(file_content)
                elif request.file_type.lower() in ["jpg", "jpeg", "png", "bmp", "tiff"]:
                    extracted_text = extract_text_from_image(file_content)
                    
            except Exception as decode_error:
                logger.warning(f"Base64 decode failed, treating as plain text: {decode_error}")
                # Fallback to treating as plain text
                extracted_text = request.file_content
        else:
            # Treat as plain text
            extracted_text = request.file_content
        
        if not extracted_text or extracted_text.startswith("Error"):
            raise HTTPException(status_code=400, detail=extracted_text or "Could not extract text from content")
        
        if request.subject not in SUBJECT_PROMPTS:
            request.subject = "general"
        
        subject_prompt = SUBJECT_PROMPTS[request.subject]
        
        # Create the prompt
        formatted_prompt = AI_SOLVER_PROMPT.format_messages(
            subject_prompt=subject_prompt,
            question=extracted_text
        )
        
        # Get response from Groq LLM
        response = llm.invoke(formatted_prompt)
        ai_answer = response.content
        
        # Process the response
        processed_response = process_ai_response(ai_answer)
        
        solution = {
            "question": "Content from uploaded file",
            "extracted_text": extracted_text,
            "answer": ai_answer,
            "subject": request.subject,
            "steps": processed_response["steps"],
            "key_points": processed_response["key_points"],
            "confidence": 95,
            "explanation": ai_answer,
            "file_info": {
                "file_type": request.file_type,
                "content_length": len(extracted_text)
            }
        }
        
        return {"solutions": [solution]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File content processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File content processing failed: {str(e)}")

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Solution Generator",
        "endpoints": {
            "text_questions": "/ai/generate-solutions",
            "single_text": "/ai/text-only",
            "file_upload": "/ai/upload-and-solve", 
            "base64_files": "/ai/process-file-content"
        }
    }

# Debug endpoint to test request parsing
@router.post("/debug-request")
async def debug_request(request: dict):
    """Debug endpoint to see what's being received"""
    return {
        "received_data": request,
        "data_type": type(request).__name__
    }