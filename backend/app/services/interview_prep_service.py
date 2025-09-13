# app/services/interview_prep_service.py
import json
import os
from urllib import response
import httpx
import asyncio
import PyPDF2
import docx
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import redis
from app.core.config import settings

# Initialize Redis for session storage
redis_client = redis.Redis(
    host=getattr(settings, 'REDIS_HOST', 'localhost'),
    port=getattr(settings, 'REDIS_PORT', 6379),
    db=getattr(settings, 'REDIS_DB', 0),
    decode_responses=True
)

class GroqAPIClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def generate_completion(self, messages: List[Dict], model: str = "llama-3.1-8b-instant", max_tokens: int = 2000) -> str:
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,
            "top_p": 1,
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    raise Exception(f"Groq API error: {response.status_code}")
                
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
        except Exception as e:
            raise Exception(f"Error calling Groq API: {str(e)}")

class InterviewPrepService:
    """Service for managing interview preparation sessions and data"""
    
    @staticmethod
    def store_session(session_id: str, user_id: str, resume_content: str, 
                     job_content: str, company: str, role: str, analysis: Dict):
        """Store interview preparation session data"""
        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "resume_content": resume_content,
            "job_content": job_content,
            "company": company,
            "role": role,
            "analysis": analysis,
            "created_at": datetime.utcnow().isoformat(),
            "chat_history": []
        }
        
        # Store in Redis with 7 days expiry
        redis_client.setex(
            f"interview_session:{session_id}",
            timedelta(days=7),
            json.dumps(session_data)
        )
        
        # Also store in user's session list
        user_sessions_key = f"user_sessions:{user_id}"
        redis_client.lpush(user_sessions_key, session_id)
        redis_client.expire(user_sessions_key, timedelta(days=30))
    
    @staticmethod
    def get_session(session_id: str, user_id: str) -> Optional[Dict]:
        """Retrieve session data"""
        session_data = redis_client.get(f"interview_session:{session_id}")
        if not session_data:
            return None
        
        session = json.loads(session_data)
        
        # Verify user ownership
        if session.get("user_id") != user_id:
            return None
        
        return session
    
    @staticmethod
    def add_chat_message(session_id: str, user_message: str, ai_response: str):
        """Add chat message to session"""
        session_data = redis_client.get(f"interview_session:{session_id}")
        if not session_data:
            return False
        
        session = json.loads(session_data)
        session["chat_history"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "user_message": user_message,
            "ai_response": ai_response
        })
        
        redis_client.setex(
            f"interview_session:{session_id}",
            timedelta(days=7),
            json.dumps(session)
        )
        return True
    
    @staticmethod
    def delete_session(session_id: str, user_id: str) -> bool:
        """Delete a session"""
        session_data = redis_client.get(f"interview_session:{session_id}")
        if not session_data:
            return False
        
        session = json.loads(session_data)
        if session.get("user_id") != user_id:
            return False
        
        # Remove from Redis
        redis_client.delete(f"interview_session:{session_id}")
        
        # Remove from user's session list
        redis_client.lrem(f"user_sessions:{user_id}", 0, session_id)
        
        return True
    
    @staticmethod
    def get_user_sessions(user_id: str, limit: int = 10, offset: int = 0) -> List[Dict]:
        """Get all sessions for a user"""
        session_ids = redis_client.lrange(f"user_sessions:{user_id}", offset, offset + limit - 1)
        sessions = []
        
        for session_id in session_ids:
            session_data = redis_client.get(f"interview_session:{session_id}")
            if session_data:
                session = json.loads(session_data)
                # Return minimal info for list view
                sessions.append({
                    "session_id": session_id,
                    "company": session.get("company"),
                    "role": session.get("role"),
                    "created_at": session.get("created_at")
                })
        
        return sessions

def extract_text_from_file(file_path: str) -> str:
    """Extract text from PDF, DOCX, or TXT files"""
    _, file_extension = os.path.splitext(file_path)
    file_extension = file_extension.lower()
    
    try:
        if file_extension == '.pdf':
            return extract_text_from_pdf(file_path)
        elif file_extension in ['.docx', '.doc']:
            return extract_text_from_docx(file_path)
        elif file_extension == '.txt':
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
    except Exception as e:
        raise Exception(f"Failed to extract text from file: {str(e)}")

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file"""
    text = ""
    with open(file_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    return text.strip()

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file"""
    doc = docx.Document(file_path)
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return text.strip()

async def analyze_resume_job_match(resume_content: str, job_description: str, 
                                 company: str, role: str) -> Dict:

    """Analyze how well a resume matches a job description"""
    
    prompt = f"""
    As an expert HR consultant and career coach, analyze the following resume against the job description and provide a comprehensive interview preparation analysis.

    **Company:** {company}
    **Role:** {role}

    **RESUME:**
    {resume_content}

    **JOB DESCRIPTION:**
    {job_description}

    Please provide a detailed analysis in the following JSON format:

    {{
        "overall_match": <integer from 0-100>,
        "strengths": [
            {{
                "skill": "skill name",
                "match": <integer from 0-100>,
                "description": "detailed explanation of how this strength aligns with job requirements"
            }}
        ],
        "gaps": [
            {{
                "skill": "missing or weak skill",
                "importance": "High/Medium/Low",
                "suggestion": "specific advice on how to address this in interview"
            }}
        ],
        "key_words": ["list", "of", "relevant", "keywords", "found", "in", "both"],
        "interview_focus_areas": [
            {{
                "area": "focus area name",
                "why": "explanation",
                "preparation_tip": "specific advice"
            }}
        ],
        "unique_selling_points": [
            "point 1: explanation",
            "point 2: explanation"
        ],
        "potential_concerns": [
            {{
                "concern": "potential interviewer concern",
                "how_to_address": "strategy to address this concern"
            }}
        ]
    }}

    Focus on actionable insights that will help the candidate prepare effectively for their interview.
    IMPORTANT: Return ONLY the JSON object, no additional text before or after.
    """
    
    try:
        groq_client = GroqAPIClient(api_key=settings.GROQ_API_KEY)
        messages = [
            {"role": "system", "content": "You are an expert HR consultant specializing in interview preparation and resume analysis."},
            {"role": "user", "content": prompt}
        ]
        
        response = await groq_client.generate_completion(messages, max_tokens=2000)
        try:
            # Extract JSON from the response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
    
            if json_start != -1 and json_end != -1:
                json_content = response[json_start:json_end]
                return json.loads(json_content)
            else:
                raise json.JSONDecodeError("No JSON found", response, 0)
        
        except json.JSONDecodeError:
            return {
                "overall_match": 0,
                "error": "Failed to parse AI response",
                "raw_response": response
            }  
        
    except Exception as e:
        raise Exception(f"Failed to analyze resume-job match: {str(e)}")

async def generate_interview_questions(session_data: Dict, question_count: int = 5,
                                     difficulty_level: str = "mixed", 
                                     question_types: List[str] = None) -> Dict:

    """Generate personalized interview questions based on analysis"""
    
    if question_types is None:
        question_types = ["behavioral", "technical", "situational"]
    
    analysis = session_data.get("analysis", {})
    company = session_data.get("company", "")
    role = session_data.get("role", "")
    
    prompt = f"""
    Based on the previous analysis for {role} at {company}, generate {question_count} personalized interview questions.

    **Analysis Summary:**
    - Overall Match: {analysis.get('overall_match', 'N/A')}%
    - Key Strengths: {', '.join([s.get('skill', '') for s in analysis.get('strengths', [])])}
    - Areas to Prepare: {', '.join([g.get('skill', '') for g in analysis.get('gaps', [])])}
    
    **Requirements:**
    - Question Types: {', '.join(question_types)}
    - Difficulty Level: {difficulty_level}
    - Focus on areas identified in the analysis
    
    Provide response in this JSON format:
    {{
        "questions": [
            {{
                "id": 1,
                "type": "Behavioral/Technical/Situational",
                "question": "the interview question",
                "framework": "approach framework (e.g., STAR method)",
                "sample_answer": "guidance for structuring the answer",
                "difficulty": "Low/Medium/High",
                "focus_area": "which skill/area this tests",
                "preparation_tips": [
                    "specific tip 1",
                    "specific tip 2"
                ]
            }}
        ],
        "general_tips": [
            "general interview preparation tip",
            "another tip"
        ]
    }}
    
    Make questions specific to the role and company, incorporating insights from the analysis.
    IMPORTANT: Return ONLY the JSON object, no additional text before or after. 
    Make questions specific to the role and company, incorporating insights from the analysis.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no extra text, explanations, or markdown
2. Ensure all JSON strings are properly quoted
3. Do not include trailing commas
4. The response must start with {{ and end with }}

Example format:
{{"questions":[{{"id":1,"type":"Behavioral","question":"...","framework":"...","sample_answer":"...","difficulty":"Medium","focus_area":"...","preparation_tips":["..."]}}],"general_tips":["..."]}}
    """
    
    try:
        groq_client = GroqAPIClient(api_key=settings.GROQ_INTERVIEW_KEY)
        messages = [
            {"role": "system", "content": "You are an expert interview coach specializing in personalized question generation."},
            {"role": "user", "content": prompt}
        ]
        
        response = await groq_client.generate_completion(messages, max_tokens=2500)
        
        # Add logging to see raw response
        print(f"Raw Groq Response: {response}")
        
        try:
            # Clean the response before parsing
            response_cleaned = response.strip()
            
            # Find JSON boundaries more carefully
            json_start = response_cleaned.find('{')
            json_end = response_cleaned.rfind('}') + 1
    
            if json_start != -1 and json_end > json_start:
                json_content = response_cleaned[json_start:json_end]
                
                # Additional cleaning - remove any trailing commas before closing braces/brackets
                import re
                json_content = re.sub(r',(\s*[}\]])', r'\1', json_content)
                
                print(f"Cleaned JSON: {json_content}")
                
                parsed_result = json.loads(json_content)
                
                # Ensure we have the expected structure
                if 'questions' not in parsed_result:
                    parsed_result['questions'] = []
                if 'general_tips' not in parsed_result:
                    parsed_result['general_tips'] = []
                
                print(f"Parsed result: {parsed_result}")
                return parsed_result
            else:
                raise json.JSONDecodeError("No valid JSON found", response, 0)
        
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            print(f"Raw response: {response}")
            
            # Return empty structure instead of error
            return {
                "questions": [],
                "general_tips": [],
                "error": f"Failed to parse AI response: {str(e)}",
                "raw_response": response[:500]  # Truncate for logging
            }
        
    except Exception as e:
        print(f"General error in generate_interview_questions: {e}")
        raise Exception(f"Failed to generate interview questions: {str(e)}")

async def get_ai_chat_response(session_data: Dict, user_message: str) -> str:
    """Get AI response for interview preparation chat"""
    
    company = session_data.get("company", "")
    role = session_data.get("role", "")
    analysis = session_data.get("analysis", {})
    if isinstance(analysis, str):
        try:
            analysis = json.loads(analysis)
        except json.JSONDecodeError:
            analysis = {}
    chat_history = session_data.get("chat_history", [])
    
    # Build context from previous chats
    chat_context = ""
    if chat_history:
        recent_chats = chat_history[-5:]  # Last 5 exchanges
        for chat in recent_chats:
            chat_context += f"User: {chat.get('user_message', '')}\nAI: {chat.get('ai_response', '')}\n\n"
    
    prompt = f"""
    You are an expert interview coach helping a candidate prepare for a {role} position at {company}.

    **Interview Analysis Context:**
    - Overall Match: {analysis.get('overall_match', 'N/A')}%
    - Key Strengths: {', '.join([s.get('skill', '') for s in analysis.get('strengths', [])])}
    - Areas to Prepare: {', '.join([g.get('skill', '') for g in analysis.get('gaps', [])])}
    
    **Recent Conversation:**
    {chat_context}
    
    **Current Question:**
    {user_message}
    
    Please provide helpful, specific advice for interview preparation. You can:
    - Help practice answers to specific questions
    - Provide feedback on their approach
    - Suggest ways to highlight their strengths
    - Give tips on addressing potential weaknesses
    - Offer company-specific insights when relevant
    - Help with general interview strategies
    
    Keep responses conversational, encouraging, and actionable. Focus on practical advice they can implement.
    """
    
    try:
        groq_client = GroqAPIClient(api_key=settings.GROQ_INTERVIEW_KEY)
        messages = [
            {"role": "system", "content": "You are a supportive and knowledgeable interview coach. Provide practical, encouraging advice."},
            {"role": "user", "content": prompt}
        ]
        
        response = await groq_client.generate_completion(messages, max_tokens=1000)
        return response
        
    except Exception as e:
        raise Exception(f"Failed to get AI chat response: {str(e)}")