# ai_solver.py
from fastapi import APIRouter, HTTPException
from typing import List, Dict
import openai
import os
from dotenv import load_dotenv

router = APIRouter(prefix="/ai", tags=["AI Solution Generation"])

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

SUBJECT_PROMPTS = {
    "math": "Provide a step-by-step solution to the following math problem. Explain each step clearly and show all calculations. Use mathematical notation where appropriate.",
    "science": "Answer the following science question comprehensively. Include relevant concepts, formulas, and examples where applicable. If the question involves diagrams, describe them in detail.",
    "history": "Provide a detailed answer to this history question. Include important dates, events, and historical context. Explain the significance of key elements.",
    "literature": "Analyze this literature question. Include relevant quotes, themes, and literary devices. Provide interpretations and critical analysis.",
    "general": "Answer the following question in a clear, student-friendly manner. Provide comprehensive information with examples where appropriate."
}

@router.post("/generate-solutions")
async def generate_solutions(questions: List[str], subject: str = "general"):
    if not questions:
        raise HTTPException(status_code=400, detail="No questions provided")
    
    if subject not in SUBJECT_PROMPTS:
        subject = "general"
    
    base_prompt = SUBJECT_PROMPTS[subject]
    
    try:
        answers = []
        for question in questions:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a helpful tutor that provides detailed, accurate answers to student questions."},
                    {"role": "user", "content": f"{base_prompt}\n\nQuestion: {question}"}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            answer = response.choices[0].message.content
            answers.append({
                "question": question,
                "answer": answer,
                "subject": subject
            })
        
        return {"solutions": answers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")