from fastapi import APIRouter, HTTPException, Form, Depends
from app.models.schemas import ArticleRequest, ArticleResponse, ArticleChatRequest, ArticleChatResponse
from app.services.Article_summary import process_article_async, generate_summary_with_groq, chat_with_article
from app.core.security import get_current_user
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/api/article/summarize", response_model=ArticleResponse)
async def summarize_article(request: ArticleRequest):
    """
    Summarize an article from a given URL
    """
    try:
        logger.info(f"Processing article: {request.url}")
        
        # Extract article content
        content, article_details = await process_article_async(str(request.url))
        
        if len(content.strip()) < 100:
            raise HTTPException(
                status_code=400, 
                detail="Article content is too short or could not be extracted properly"
            )
        
        # Generate summary
        logger.info("Generating summary...")
        summary = generate_summary_with_groq(content)
        
        if not summary or len(summary.strip()) < 10:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate a meaningful summary"
            )
        
        logger.info("Summary generated successfully")
        
        return ArticleResponse(
            summary=summary,
            articleDetails=article_details
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing {request.url}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.post("/api/article/chat-simple")
async def chat_with_article_simple(
    request: dict,  # {"message": "user message", "article_content": "extracted text", "article_url": "optional"}
    current_user: dict = Depends(get_current_user),
):
    """
    Simple chat with article content - similar to PDF chat-simple
    """
    try:
        message = request.get("message", "").strip()
        article_content = request.get("article_content", "").strip()
        article_url = request.get("article_url", "")
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        if not article_content:
            raise HTTPException(status_code=400, detail="Article content is required")
        
        reply = chat_with_article(message, article_content)
        return {
            "response": reply, 
            "timestamp": datetime.utcnow().isoformat(),
            "article_url": article_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.post("/api/article/chat")
async def chat_with_article_endpoint(
    current_user: dict = Depends(get_current_user),
    message: str = Form(...),
    url: str = Form(None),  # Article URL
    article_content: str = Form(None),  # Pre-extracted article content
):
    """
    Chat with article - can either provide URL or pre-extracted content
    Similar to PDF chat function structure
    """
    try:
        if url:
            # Extract article content from URL
            logger.info(f"Extracting content from URL: {url}")
            try:
                content, article_details = await process_article_async(url)
                if len(content.strip()) < 50:
                    raise HTTPException(
                        status_code=400, 
                        detail="Article content is too short or could not be extracted"
                    )
                text_content = content
                source_info = {
                    "url": url,
                    "title": article_details.get("title", ""),
                    "author": article_details.get("author", "")
                }
            except Exception as e:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Failed to extract article content: {str(e)}"
                )
                
        elif article_content:
            # Use provided article content
            text_content = article_content
            source_info = {"source": "provided_content"}
        else:
            raise HTTPException(
                status_code=400, 
                detail="Either url or article_content must be provided"
            )

        if not text_content.strip():
            raise HTTPException(status_code=400, detail="No article content found")

        # Generate response using chat function
        reply = chat_with_article(message, text_content)
        
        return {
            "response": reply,
            "timestamp": datetime.utcnow().isoformat(),
            "source_info": source_info
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Article chat failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.post("/api/article/batch-chat")
async def batch_chat_with_article(
    request: dict,  # {"messages": [{"message": "text", "timestamp": "..."}], "article_content": "text"}
    current_user: dict = Depends(get_current_user),
):
    """
    Handle multiple chat messages with an article in a single request
    """
    try:
        messages = request.get("messages", [])
        article_content = request.get("article_content", "").strip()
        
        if not messages:
            raise HTTPException(status_code=400, detail="Messages are required")
        
        if not article_content:
            raise HTTPException(status_code=400, detail="Article content is required")
        
        responses = []
        for msg_data in messages:
            message = msg_data.get("message", "").strip()
            if message:
                reply = chat_with_article(message, article_content)
                responses.append({
                    "original_message": message,
                    "response": reply,
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        return {
            "responses": responses,
            "total_processed": len(responses)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch chat failed: {str(e)}")

# Optional: Add article analysis history endpoints (similar to PDF)
@router.get("/api/article/my-chats")
async def get_user_article_chats(
    current_user: dict = Depends(get_current_user),
    # db: Session = Depends(get_db),  # Uncomment if you have database integration
):
    """
    Get user's article chat history (if you implement storage)
    """
    try:
        # This would require implementing storage for article chats
        # Similar to pdf_service.get_user_analyses
        return {"message": "Article chat history not implemented yet"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chat history: {str(e)}")