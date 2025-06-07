from fastapi import APIRouter, HTTPException
from app.models.schemas import ArticleRequest, ArticleResponse
from app.services.Article_summary import process_article_async, generate_summary_with_claude
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
        summary = generate_summary_with_claude(content)
        
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
