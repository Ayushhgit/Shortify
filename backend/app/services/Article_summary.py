from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import ArticleDetails, ArticleRequest, ArticleResponse
import requests
from bs4 import BeautifulSoup
from newspaper import Article
from datetime import datetime
import re
from urllib.parse import urlparse
import asyncio
from concurrent.futures import ThreadPoolExecutor
import os
from langchain_anthropic import ChatAnthropic
from langchain.schema import HumanMessage
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



try:
    claude = ChatAnthropic(
        model="claude-3-sonnet-20240229",
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
    )
except Exception as e:
    logger.warning(f"Claude client initialization failed: {e}")
    claude = None

def extract_article_content(url: str) -> tuple[str, ArticleDetails]:
    """
    Extract article content using newspaper3k with fallback to BeautifulSoup
    """
    try:
        # Method 1: newspaper3k (usually more reliable)
        article = Article(url)
        article.download()
        article.parse()
        
        if article.text and len(article.text.strip()) > 100:
            # Calculate estimated read time (average 200 words per minute)
            word_count = len(article.text.split())
            read_time = max(1, round(word_count / 200))
            
            # Format publish date
            publish_date = None
            if article.publish_date:
                publish_date = article.publish_date.strftime("%B %d, %Y")
            
            # Get domain
            domain = urlparse(url).netloc.replace('www.', '')
            
            article_details = ArticleDetails(
                title=article.title or "Untitled Article",
                author=', '.join(article.authors) if article.authors else None,
                publishDate=publish_date,
                domain=domain,
                readTime=read_time
            )
            
            return article.text, article_details
        
    except Exception as e:
        logger.warning(f"newspaper3k failed for {url}: {e}")
    
    # Method 2: Fallback to BeautifulSoup + requests
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
            script.decompose()
        
        # Try to find the main content
        content_selectors = [
            'article', '[role="main"]', '.post-content', '.entry-content',
            '.article-content', '.content', '#content', '.post-body'
        ]
        
        content = ""
        title = ""
        
        # Extract title
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text().strip()
        
        # Try to find main content
        for selector in content_selectors:
            elements = soup.select(selector)
            if elements:
                content = ' '.join([elem.get_text().strip() for elem in elements])
                break
        
        # If no specific content area found, get all paragraphs
        if not content or len(content.strip()) < 100:
            paragraphs = soup.find_all('p')
            content = ' '.join([p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 20])
        
        if content and len(content.strip()) > 100:
            # Clean up content
            content = re.sub(r'\s+', ' ', content).strip()
            
            # Calculate read time
            word_count = len(content.split())
            read_time = max(1, round(word_count / 200))
            
            # Get domain
            domain = urlparse(url).netloc.replace('www.', '')
            
            article_details = ArticleDetails(
                title=title or "Untitled Article",
                author=None,
                publishDate=None,
                domain=domain,
                readTime=read_time
            )
            
            return content, article_details
            
    except Exception as e:
        logger.error(f"BeautifulSoup fallback failed for {url}: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to extract content from URL: {str(e)}")
    
    raise HTTPException(status_code=400, detail="Could not extract meaningful content from the provided URL")

def generate_summary_with_claude(content: str) -> str:
    """
    Generate summary using Claude via LangChain
    """
    if not claude:
        # Fallback simple summary if Claude is not available
        sentences = content.split('.')[:5]  # Take first 5 sentences
        return '. '.join(sentences) + '.'
    
    try:
        prompt = f"""
        Please provide a comprehensive yet concise summary of the following article. 
        Focus on the main points, key arguments, and important details. 
        Structure the summary with clear paragraphs and bullet points where appropriate.
        Make it informative and easy to understand.

        Article content:
        {content[:8000]}  # Limit content to avoid token limits
        
        Summary:
        """
        
        message = HumanMessage(content=prompt)
        response = claude([message])
        
        return response.content.strip()
        
    except Exception as e:
        logger.error(f"Claude summarization failed: {e}")
        # Fallback to simple extractive summary
        sentences = content.split('.')
        # Take first few sentences up to ~300 words
        summary_sentences = []
        word_count = 0
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence:
                sentence_words = len(sentence.split())
                if word_count + sentence_words > 300:
                    break
                summary_sentences.append(sentence)
                word_count += sentence_words
        
        return '. '.join(summary_sentences) + '.'

async def process_article_async(url: str) -> tuple[str, ArticleDetails]:
    """
    Process article extraction in a thread pool to avoid blocking
    """
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        return await loop.run_in_executor(executor, extract_article_content, url)