from app.models.schemas import QuizResponse, QuizRequest, Question
import httpx
from fastapi import HTTPException
from typing import List, Dict, Any, Optional
from enum import Enum
import random
import json
import logging
import asyncio
from dotenv import load_dotenv
import os
from ..core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GroqAPIClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def generate_completion(self, messages: List[Dict], model: str = "llama3-8b-8192", max_tokens: int = 2000) -> str:
        """Generate completion using Groq API"""
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
                    logger.error(f"Groq API error: {response.status_code} - {response.text}")
                    raise HTTPException(status_code=500, detail=f"Groq API error: {response.status_code}")
                
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
        except httpx.TimeoutException:
            logger.error("Groq API timeout")
            raise HTTPException(status_code=504, detail="API request timeout")
        except Exception as e:
            logger.error(f"Error calling Groq API: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error generating content: {str(e)}")

class QuizGenerator:
    def __init__(self, groq_client: GroqAPIClient):
        self.groq_client = groq_client
        self.difficulty_descriptions = {
            "easy": "beginner-friendly questions focusing on basic concepts, definitions, and simple recall",
            "medium": "intermediate questions requiring understanding, application, and some analysis",
            "hard": "advanced questions involving complex analysis, synthesis, evaluation, and problem-solving"
        }
    
    def get_system_prompt(self) -> str:
        return """You are an expert educational content creator specializing in quiz generation. 
Your task is to create high-quality, educational questions that are:

1. Clear and unambiguous
2. Educationally valuable
3. Appropriate for the specified difficulty level
4. Relevant to the given topic
5. Properly formatted as valid JSON

Always respond with valid JSON only. Do not include any explanatory text outside the JSON structure."""

    def create_question_prompt(self, question_type: str, topic: str, difficulty: str, num_questions: int) -> str:
        difficulty_desc = self.difficulty_descriptions[difficulty]
        
        base_instructions = f"""Generate {num_questions} {difficulty} level {question_type.upper()} question(s) about: {topic}

Difficulty level: {difficulty_desc}

Requirements:"""

        format_instructions = {
            "mcq": """
- Each question must have exactly 4 options
- Only one option should be correct
- Options should be plausible but distinct
- Include brief explanations for correct answers

Format as JSON array:
[
  {
    "type": "mcq",
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Brief explanation why this is correct"
  }
]""",
            
            "qna": """
- Questions should encourage detailed, thoughtful answers
- Answers should be comprehensive but concise
- Include explanations that add educational value

Format as JSON array:
[
  {
    "type": "qna",
    "question": "Your question here?",
    "answer": "Detailed answer here",
    "explanation": "Additional context or clarification"
  }
]""",
            
            "numerical": """
- Include mathematical problems, calculations, or quantitative analysis
- Provide step-by-step solutions
- Include units where applicable
- Ensure problems are solvable with given information

Format as JSON array:
[
  {
    "type": "numerical",
    "question": "Your numerical problem here?",
    "answer": "Final numerical answer with units if applicable",
    "explanation": "Step-by-step solution process"
  }
]"""
        }
        
        return base_instructions + format_instructions[question_type]

    async def generate_questions_for_type(self, question_type: str, topic: str, difficulty: str, count: int) -> List[Dict[str, Any]]:
        """Generate questions of a specific type"""
        if not self.groq_client.api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        try:
            system_prompt = self.get_system_prompt()
            user_prompt = self.create_question_prompt(question_type, topic, difficulty, count)
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            response = await self.groq_client.generate_completion(messages)
            
            # Parse JSON response
            try:
                questions_data = json.loads(response.strip())
                
                # Handle both single question object and array of questions
                if isinstance(questions_data, dict):
                    questions_data = [questions_data]
                elif not isinstance(questions_data, list):
                    raise ValueError("Expected JSON array or object")
                
                # Validate and clean questions
                validated_questions = []
                for q in questions_data:
                    if self.validate_question(q, question_type):
                        validated_questions.append(q)
                
                if not validated_questions:
                    raise HTTPException(status_code=500, detail=f"No valid {question_type} questions generated")
                
                return validated_questions[:count]  # Ensure we don't exceed requested count
                
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}, Response: {response}")
                raise HTTPException(status_code=500, detail="Failed to parse AI response")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error generating {question_type} questions: {e}")
            raise HTTPException(status_code=500, detail=f"Error generating {question_type} questions: {str(e)}")

    def validate_question(self, question: Dict[str, Any], expected_type: str) -> bool:
        """Validate question structure"""
        required_fields = ["type", "question", "answer"]
        
        if not all(field in question for field in required_fields):
            return False
        
        if question["type"] != expected_type:
            return False
        
        if expected_type == "mcq" and ("options" not in question or len(question.get("options", [])) != 4):
            return False
        
        return True

    def distribute_questions(self, total_questions: int, question_types: List[str]) -> Dict[str, int]:
        """Distribute questions evenly across selected types"""
        base_count = total_questions // len(question_types)
        remainder = total_questions % len(question_types)
        
        distribution = {}
        for i, question_type in enumerate(question_types):
            distribution[question_type] = base_count + (1 if i < remainder else 0)
        
        return distribution

    async def generate_quiz(self, request: QuizRequest) -> QuizResponse:
        """Generate a complete quiz based on the request"""
        questions = []
        
        # Distribute questions across different types
        type_distribution = self.distribute_questions(request.num_questions, request.question_types)
        
        # Generate questions for each type concurrently
        tasks = []
        for question_type, count in type_distribution.items():
            if count > 0:
                task = self.generate_questions_for_type(
                    question_type, request.topic, request.difficulty, count
                )
                tasks.append(task)
        
        # Wait for all questions to be generated
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Error in concurrent generation: {result}")
                if isinstance(result, HTTPException):
                    raise result
                raise HTTPException(status_code=500, detail=f"Error generating questions: {str(result)}")
            
            for question_data in result:
                try:
                    question = Question(**question_data)
                    questions.append(question)
                except Exception as e:
                    logger.error(f"Error creating question object: {e}")
                    continue
        
        if not questions:
            raise HTTPException(status_code=500, detail="Failed to generate any valid questions")
        
        # Shuffle questions for variety
        random.shuffle(questions)
        
        # Get current timestamp
        from datetime import datetime
        current_time = datetime.now().isoformat()
        
        return QuizResponse(
            questions=questions,
            topic=request.topic,
            difficulty=request.difficulty,
            total_questions=len(questions),
            generated_at=current_time
        )