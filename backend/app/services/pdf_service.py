# app/services/pdf_service.py
import os
import json
import re
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path
import PyPDF2
import fitz  # PyMuPDF for better text extraction
import requests
from fastapi import UploadFile
import aiofiles

from ..core.config import settings

class PDFService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(exist_ok=True)
    
    async def save_uploaded_file(self, file: UploadFile, file_id: str) -> str:
        """Save uploaded PDF file to disk"""
        file_path = self.upload_dir / f"{file_id}.pdf"
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        return str(file_path)
    
    def extract_text_from_pdf(self, file_path: str) -> tuple[str, int]:
        """Extract text content from PDF using PyMuPDF with PyPDF2 fallback"""
        try:
            # Try PyMuPDF first (better quality)
            doc = fitz.open(file_path)
            text_content = []
            page_count = len(doc)
            
            for page_num in range(page_count):
                page = doc.load_page(page_num)
                text = page.get_text()
                if text.strip():
                    text_content.append(text.strip())
            
            doc.close()
            return "\n\n".join(text_content), page_count
            
        except Exception:
            # Fallback to PyPDF2
            try:
                with open(file_path, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    text_content = []
                    page_count = len(reader.pages)
                    
                    for page in reader.pages:
                        text = page.extract_text()
                        if text.strip():
                            text_content.append(text.strip())
                    
                    return "\n\n".join(text_content), page_count
            except Exception as e:
                raise Exception(f"Failed to extract text: {str(e)}")
    
    async def analyze_document_complete(self, file: UploadFile, analysis_type: str = "general", role: str = None) -> Dict[str, Any]:
        """Complete document analysis pipeline that matches frontend expectations"""
        try:
            # Generate unique file ID
            file_id = str(uuid.uuid4())
            
            # Save the uploaded file
            file_path = await self.save_uploaded_file(file, file_id)
            
            # Extract text and get page count
            text_content, page_count = self.extract_text_from_pdf(file_path)
            
            if not text_content.strip():
                raise Exception("No text content could be extracted from the PDF")
            
            # Calculate basic metrics
            basic_metrics = self.calculate_basic_metrics(text_content)
            
            # Perform AI analysis
            analysis_result = self.analyze_document(text_content, analysis_type, role)
            
            # Clean up the file (optional - you might want to keep it)
            try:
                os.remove(file_path)
            except:
                pass  # Ignore cleanup errors
            
            # Format response to match frontend expectations
            response_data = {
                "success": True,
                "file_id": file_id,
                "filename": file.filename,
                "page_count": page_count,
                "analysis_data": {
                    "word_count": basic_metrics["word_count"],
                    "character_count": basic_metrics["character_count"],
                    "reading_time_minutes": basic_metrics["reading_time_minutes"],
                    "complexity": analysis_result.get("complexity", "Unknown"),
                    "topics": analysis_result.get("topics", []),
                    "sentiment": analysis_result.get("sentiment", "Neutral"),
                    "document_type": analysis_result.get("document_type", "document"),
                    "key_points": analysis_result.get("key_points", []),
                    "technical_score": self._calculate_technical_score(text_content),
                    "business_score": self._calculate_business_score(text_content),
                    "academic_score": self._calculate_academic_score(text_content),
                },
                "summary": analysis_result.get("summary", "Analysis completed successfully."),
                "analysis_timestamp": basic_metrics["analysis_timestamp"]
            }
            
            # Add resume-specific data if analyzing a resume
            if analysis_type == "resume":
                response_data.update({
                    "score": analysis_result.get("score", 0),
                    "strengths": analysis_result.get("strengths", []),
                    "improvements": analysis_result.get("improvements", []),
                    "keywords": analysis_result.get("keywords", []),
                    "matchedSkills": analysis_result.get("matchedSkills", 0),
                    "totalSkills": analysis_result.get("totalSkills", 0),
                    "recommendedSkills": analysis_result.get("recommendedSkills", []),
                    "experience_years": analysis_result.get("experience_years", 0),
                })
            
            return response_data
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "summary": f"Analysis failed: {str(e)}",
                "analysis_data": {
                    "word_count": 0,
                    "page_count": 0,
                    "reading_time_minutes": 0,
                    "complexity": "Unknown",
                    "topics": [],
                    "sentiment": "Neutral",
                }
            }
    
    def analyze_document(self, text_content: str, analysis_type: str = "general", role: str = None) -> Dict[str, Any]:
        """Analyze document using Groq API - enhanced version"""
        
        # Truncate text if too long (keep first 8000 chars)
        if len(text_content) > 8000:
            text_content = text_content[:8000] + "..."
        
        if analysis_type == "resume":
            return self._analyze_resume(text_content, role or "general position")
        else:
            return self._analyze_general_document(text_content)
    
    def _analyze_resume(self, text_content: str, role: str = "general position") -> Dict[str, Any]:
        """Analyze resume using Groq API"""
        messages = [
            {
                "role": "system",
                "content": "You are a professional resume reviewer. Return output ONLY in valid raw JSON format. No explanation, no markdown."
            },
            {
                "role": "user",
                "content": f"""
The user is applying for a {role} role. Here is their resume:
\"\"\"{text_content}\"\"\"

Evaluate it and return a pure JSON like:
{{
  "score": 0-100,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "summary": "Brief overall assessment of the resume quality and fit for the role",
  "keywords": ["relevant", "keywords", "found"],
  "matchedSkills": 8,
  "totalSkills": 12,
  "recommendedSkills": ["skill1", "skill2", "skill3"],
  "experience_years": 0,
  "document_type": "resume",
  "complexity": "Basic/Intermediate/Advanced",
  "topics": ["career area 1", "career area 2"],
  "sentiment": "Positive/Neutral/Negative"
}}
"""
            }
        ]
        
        return self._make_groq_request(messages)
    
    def _analyze_general_document(self, text_content: str) -> Dict[str, Any]:
        """Analyze general document using Groq API"""
        messages = [
            {
                "role": "system",
                "content": "You are a document analyst. Return output ONLY in valid raw JSON format. No explanation, no markdown."
            },
            {
                "role": "user",
                "content": f"""
Analyze this document and return a pure JSON like:
{{
  "document_type": "report/manual/article/presentation/etc",
  "summary": "Brief summary of the document content and main purpose",
  "key_points": ["main point 1", "main point 2", "main point 3"],
  "topics": ["topic1", "topic2", "topic3"],
  "complexity": "Basic/Intermediate/Advanced",
  "sentiment": "Positive/Neutral/Negative"
}}

Document content:
\"\"\"{text_content}\"\"\"
"""
            }
        ]
        
        return self._make_groq_request(messages)
    
    def _make_groq_request(self, messages: List[Dict]) -> Dict[str, Any]:
        """Make request to Groq API and parse JSON response"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama3-70b-8192",
            "messages": messages,
            "max_tokens": 1000,
            "temperature": 0.3
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()
            
            raw_output = response.json()["choices"][0]["message"]["content"]
            
            # Extract JSON from response (handle markdown formatting)
            try:
                # Try to find JSON in code blocks first
                json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_output, re.DOTALL)
                if json_match:
                    json_string = json_match.group(1)
                else:
                    # Try to extract JSON directly
                    json_string = raw_output.strip("` \n")
                
                parsed_json = json.loads(json_string)
                return parsed_json
                
            except (json.JSONDecodeError, AttributeError) as e:
                # Return fallback response if JSON parsing fails
                return {
                    "document_type": "unknown",
                    "summary": "Analysis completed but response parsing failed",
                    "key_points": ["Analysis was performed but results could not be parsed properly"],
                    "topics": ["general"],
                    "complexity": "Unknown",
                    "sentiment": "Neutral",
                    "error": f"Failed to parse AI response: {str(e)}",
                    "raw_response": raw_output[:200] + "..." if len(raw_output) > 200 else raw_output
                }
                
        except requests.RequestException as e:
            return {
                "document_type": "unknown",
                "summary": "Analysis failed due to API error",
                "key_points": ["API request failed"],
                "topics": ["error"],
                "complexity": "Unknown",
                "sentiment": "Neutral",
                "error": f"API request failed: {str(e)}"
            }
    
    def _calculate_technical_score(self, text_content: str) -> int:
        """Calculate technical content score (0-100)"""
        technical_keywords = [
            'algorithm', 'database', 'api', 'framework', 'programming', 'software',
            'technical', 'system', 'architecture', 'development', 'code', 'engineering',
            'technology', 'platform', 'infrastructure', 'integration', 'security'
        ]
        
        text_lower = text_content.lower()
        matches = sum(1 for keyword in technical_keywords if keyword in text_lower)
        return min(100, (matches * 10))
    
    def _calculate_business_score(self, text_content: str) -> int:
        """Calculate business content score (0-100)"""
        business_keywords = [
            'business', 'strategy', 'management', 'marketing', 'sales', 'revenue',
            'profit', 'market', 'customer', 'client', 'stakeholder', 'roi',
            'growth', 'analysis', 'planning', 'budget', 'finance'
        ]
        
        text_lower = text_content.lower()
        matches = sum(1 for keyword in business_keywords if keyword in text_lower)
        return min(100, (matches * 10))
    
    def _calculate_academic_score(self, text_content: str) -> int:
        """Calculate academic content score (0-100)"""
        academic_keywords = [
            'research', 'study', 'analysis', 'methodology', 'literature', 'theory',
            'hypothesis', 'data', 'results', 'conclusion', 'abstract', 'references',
            'peer', 'review', 'journal', 'publication', 'academic'
        ]
        
        text_lower = text_content.lower()
        matches = sum(1 for keyword in academic_keywords if keyword in text_lower)
        return min(100, (matches * 10))
    
    def chat_with_document(self, user_message: str, document_content: str, 
                          chat_history: List[Dict] = None) -> str:
        """Simple chat with document"""
        if chat_history is None:
            chat_history = []
        
        # Limit document content for context
        if len(document_content) > 4000:
            document_content = document_content[:4000] + "..."
        
        messages = [
            {
                "role": "system",
                "content": f"""You are an AI assistant that helps users understand documents. 
You have access to this document content:

{document_content}

Answer questions about this document accurately. If information isn't in the document, say so politely."""
            }
        ]
        
        # Add recent chat history (last 3 exchanges)
        for chat in chat_history[-3:]:
            messages.extend([
                {"role": "user", "content": chat["user_message"]},
                {"role": "assistant", "content": chat["ai_response"]}
            ])
        
        # Add current question
        messages.append({"role": "user", "content": user_message})
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama3-70b-8192",
            "messages": messages,
            "max_tokens": 1000,
            "temperature": 0.3
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].strip()
            
        except Exception as e:
            return f"I'm sorry, I encountered an error: {str(e)}"
    
    def calculate_basic_metrics(self, text_content: str) -> Dict[str, Any]:
        """Calculate basic document metrics"""
        words = len(text_content.split())
        characters = len(text_content)
        
        # Estimate reading time (200 words per minute)
        reading_time = max(1, words // 200)
        
        return {
            "word_count": words,
            "character_count": characters,
            "reading_time_minutes": reading_time,
            "analysis_timestamp": datetime.utcnow().isoformat()
        }