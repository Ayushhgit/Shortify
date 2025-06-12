# app/routers/research_router.py

import time
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.models.schemas import QueryRequest, ResearchResponse
from app.services.research_agent import get_memory, run_research_agent, run_direct_research
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/research", tags=["research"])

@router.post("/clear-session")
async def clear_session(req: dict):
    """Clear conversation history for a specific session."""
    try:
        session_id = req.get("session_id")
        if session_id:
            # Clear Redis memory for this session
            memory = get_memory(session_id)
            memory.clear()
        
        return {"status": "session_cleared"}
    except Exception as e:
        logger.error(f"Error clearing session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear session"
        )

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

@router.post("/agent/query", response_model=ResearchResponse)
async def run_agent(req: QueryRequest):
    try:
        # Generate or use provided session_id
        session_id = req.session_id or f"session_{int(time.time())}"
        
        # Pass session_id to the agent
        result = run_research_agent(req.query, session_id)
        
        return result
        
    except Exception as e:
        logger.error(f"Unexpected error in research endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your research query"
        )

@router.get("/health")
async def health_check():
    """Health check endpoint for the research service."""
    return {"status": "healthy", "service": "research_agent"}

@router.post("/direct/query", response_model=ResearchResponse)
async def run_direct_agent(req: QueryRequest):
    """
    Process a research query using direct tool access (fallback method).
    
    Args:
        req: QueryRequest containing the research query
        
    Returns:
        ResearchResponse: Structured research results
    """
    try:
        if not req.query or not req.query.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query cannot be empty"
            )
        
        logger.info(f"Received direct research query: {req.query[:100]}...")
        result = run_direct_research(req.query)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in direct research endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your research query"
        )