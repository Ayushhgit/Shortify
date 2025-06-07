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
import json
import logging
from groq import Groq  # Add this import

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def generate_summary_with_groq(content: str) -> str:
    """
    Generate summary using Groq API
    """
    if not GROQ_API_KEY:
        logger.warning("Groq API key not found, using fallback summary")
        # Fallback simple summary if Groq API key is not available
        sentences = content.split('.')[:5]  # Take first 5 sentences
        return '. '.join(sentences) + '.'
    
    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Limit content to avoid token limits (Groq has context limits)
        truncated_content = content[:6000] if len(content) > 6000 else content
        
        payload = {
            "model": "llama3-70b-8192",  # You can also use "mixtral-8x7b-32768" or "gemma-7b-it"
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional article summarizer. Create comprehensive yet concise summaries that capture the main points, key arguments, and important details. Structure your summaries with clear paragraphs and use bullet points where appropriate to make them informative and easy to understand."
                },
                {
                    "role": "user",
                    "content": f"Please provide a comprehensive yet concise summary of the following article:\n\n{truncated_content}"
                }
            ],
            "temperature": 0.3,
            "max_tokens": 1000,
            "top_p": 0.9
        }
        
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            summary = result['choices'][0]['message']['content'].strip()
            return summary
        else:
            logger.error(f"Groq API error {response.status_code}: {response.text}")
            raise Exception(f"Groq API returned status code {response.status_code}")
            
    except Exception as e:
        logger.error(f"Groq summarization failed: {e}")
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

async def process_article_async(url: str) -> tuple[str, ArticleDetails]:
    """
    Process article extraction in a thread pool to avoid blocking
    """
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        return await loop.run_in_executor(executor, extract_article_content, url)

def chat_with_article(user_message: str, article_content: str) -> str:
    """
    Generate a response to user's question based on article content
    Similar to PDF chat functionality
    """
    if not GROQ_API_KEY:
        return "Groq API key not configured. Please set GROQ_API_KEY environment variable."
    
    try:
        # Create a prompt that combines the article content with the user's question
        chat_prompt = f"""
        Based on the following article content, please answer the user's question accurately and helpfully.
        
        ARTICLE CONTENT:
        {article_content[:4000]}  # Limit content to avoid token limits
        
        USER QUESTION:
        {user_message}
        
        Please provide a clear, informative response based on the article content. If the question cannot be answered from the article, please say so.
        """
        
        # Initialize Groq client
        client = Groq(api_key=GROQ_API_KEY)
        
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",  # or your preferred model
            messages=[
                {
                    "role": "system", 
                    "content": "You are a helpful assistant that answers questions based on provided article content. Be accurate and cite specific parts of the article when relevant."
                },
                {"role": "user", "content": chat_prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        logger.error(f"Error in chat_with_article: {e}")
        return f"Sorry, I encountered an error while processing your question: {str(e)}"

def chat_with_article_simple(user_message: str, article_content: str) -> str:
    """
    Simplified version that creates a focused response using direct API calls
    """
    if not GROQ_API_KEY:
        return "Groq API key not configured. Please set GROQ_API_KEY environment variable."
    
    try:
        # Truncate article content if too long
        max_content_length = 3000
        if len(article_content) > max_content_length:
            article_content = article_content[:max_content_length] + "..."
        
        prompt = f"""
        Article: {article_content}
        
        Question: {user_message}
        
        Answer the question based on the article content above. Be concise and accurate.
        """
        
        # Use direct API call (consistent with your generate_summary_with_groq function)
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant that answers questions based on provided article content. Be concise and accurate."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 800,
            "temperature": 0.5
        }
        
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return result['choices'][0]['message']['content'].strip()
        else:
            logger.error(f"Groq API error {response.status_code}: {response.text}")
            return f"Error: Groq API returned status code {response.status_code}"
        
    except Exception as e:
        logger.error(f"Error in chat_with_article_simple: {e}")
        return f"Error generating response: {str(e)}"