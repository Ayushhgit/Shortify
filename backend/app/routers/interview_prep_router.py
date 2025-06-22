# app/routers/interview_prep_router.py
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from typing import Optional, List
import os
import shutil
import json
import uuid
from datetime import datetime

from app.services.interview_prep_service import (
    InterviewPrepService,
    extract_text_from_file,
    analyze_resume_job_match,
    generate_interview_questions,
    get_ai_chat_response
)
from app.core.security import get_current_user
from app.core.rate_limiting import interview_prep_rate_limit
from app.models.schemas import (
    InterviewPrepRequest,
    InterviewAnalysisResponse,
    InterviewQuestionsResponse,
    ChatMessage,
    ChatResponse
)

router = APIRouter(prefix="/interview-prep", tags=["Interview Preparation"])

@router.post("/analyze", response_model=InterviewAnalysisResponse)
async def analyze_interview_match(
    resume_file: Optional[UploadFile] = File(None),
    job_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    job_text: Optional[str] = Form(None),
    company: str = Form(...),
    role: str = Form(...),
    current_user: dict = Depends(get_current_user),
    rate_limit_data: dict = Depends(interview_prep_rate_limit)
):
    """
    Analyze resume against job description for interview preparation
    """
    try:
        user = rate_limit_data['user']
        rate_info = rate_limit_data['rate_limit_info']
        
        # Validate input
        if not resume_text and not resume_file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either resume text or resume file is required"
            )
        
        if not job_text and not job_file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either job description text or job file is required"
            )
        
        # Create temp directory
        temp_dir = f"temp/{uuid.uuid4()}"
        os.makedirs(temp_dir, exist_ok=True)
        
        try:
            # Process resume
            if resume_file:
                resume_path = f"{temp_dir}/{resume_file.filename}"
                with open(resume_path, "wb") as f:
                    shutil.copyfileobj(resume_file.file, f)
                resume_content = extract_text_from_file(resume_path)
            else:
                resume_content = resume_text
            
            # Process job description
            if job_file:
                job_path = f"{temp_dir}/{job_file.filename}"
                with open(job_path, "wb") as f:
                    shutil.copyfileobj(job_file.file, f)
                job_content = extract_text_from_file(job_path)
            else:
                job_content = job_text
            
            # Analyze match
            analysis_result = await analyze_resume_job_match(
                resume_content=resume_content,
                job_description=job_content,
                company=company,
                role=role
            )
            
            
            # Add usage info
            analysis_result["usage_info"] = {
                "remaining": rate_info['remaining'],
                "limit": rate_info['limit'],
                "subscription": rate_info['subscription']
            }
            
            # Store analysis session for chat
            session_id = str(uuid.uuid4())
            InterviewPrepService.store_session(
                session_id=session_id,
                user_id=str(user.id),
                resume_content=resume_content,
                job_content=job_content,
                company=company,
                role=role,
                analysis=analysis_result
            )
            
            analysis_result["session_id"] = session_id
            
            return analysis_result
            
        finally:
            # Clean up temp files
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
                
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze interview match: {str(e)}"
        )

@router.post("/questions", response_model=InterviewQuestionsResponse)
async def generate_questions(
    session_id: str = Form(...),
    question_count: int = Form(5),
    difficulty_level: str = Form("mixed"),  # easy, medium, hard, mixed
    question_types: List[str] = Form(["behavioral", "technical", "situational"]),
    current_user: dict = Depends(get_current_user),
    rate_limit_data: dict = Depends(interview_prep_rate_limit)
):
    """
    Generate interview questions based on previous analysis
    """
    try:
        user = rate_limit_data['user']
        rate_info = rate_limit_data['rate_limit_info']
        
        # Get session data
        session_data = InterviewPrepService.get_session(session_id, str(user.id))
        if not session_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview session not found"
            )
        
        # Generate questions
        questions = await generate_interview_questions(
            session_data=session_data,
            question_count=question_count,
            difficulty_level=difficulty_level,
            question_types=question_types
        )
        
        # Add usage info
        questions["usage_info"] = {
            "remaining": rate_info['remaining'],
            "limit": rate_info['limit'],
            "subscription": rate_info['subscription']
        }
        
        return questions
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate interview questions: {str(e)}"
        )

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    session_id: str = Form(...),
    message: str = Form(...),
    current_user: dict = Depends(get_current_user),
    rate_limit_data: dict = Depends(interview_prep_rate_limit)
):
    """
    Chat with AI about interview preparation
    """
    try:
        user = rate_limit_data['user']
        rate_info = rate_limit_data['rate_limit_info']
        
        # Get session data
        session_data = InterviewPrepService.get_session(session_id, str(user.id))
        if not session_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview session not found"
            )
        
        # Get AI response
        ai_response = await get_ai_chat_response(
            session_data=session_data,
            user_message=message
        )
        
        # Store chat message
        InterviewPrepService.add_chat_message(
            session_id=session_id,
            user_message=message,
            ai_response=ai_response
        )
        
        return {
            "response": ai_response,
            "session_id": session_id,
            "usage_info": {
                "remaining": rate_info['remaining'],
                "limit": rate_info['limit'],
                "subscription": rate_info['subscription']
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get AI chat response: {str(e)}"
        )

@router.get("/session/{session_id}")
async def get_session_data(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve session data for a user
    """
    try:
        session_data = InterviewPrepService.get_session(session_id, str(current_user.id))
        if not session_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        return session_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve session: {str(e)}"
        )

@router.delete("/session/{session_id}")
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete an interview preparation session
    """
    try:
        success = InterviewPrepService.delete_session(session_id, str(current_user.id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        return {"message": "Session deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {str(e)}"
        )

@router.get("/sessions")
async def get_user_sessions(
    current_user: dict = Depends(get_current_user),
    limit: int = 10,
    offset: int = 0
):
    """
    Get all interview preparation sessions for a user
    """
    try:
        sessions = InterviewPrepService.get_user_sessions(
            user_id=str(current_user.id),
            limit=limit,
            offset=offset
        )
        
        return {"sessions": sessions}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve sessions: {str(e)}"
        )