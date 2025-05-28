import os
import requests
import json
import re
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")
API_URL = "https://api.groq.com/openai/v1/chat/completions"

def analyze_resume(text: str, role: str):
    messages = [
        {
            "role": "system",
            "content": "You are a professional resume reviewer. Return output ONLY in valid raw JSON format. No explanation, no markdown."
        },
        {
            "role": "user",
            "content": f"""
The user is applying for a {role} role.
Here is their resume:
\"\"\"{text}\"\"\"

Evaluate it and return a pure JSON like:
{{
  "score": 0-100,
  "strengths": ["..."],
  "improvements": ["..."],
  "summary": "...",
  "keywords": ["..."],
  "matchedSkills": 8,
  "totalSkills": 12,
  "recommendedSkills": ["..."]
}}
"""
        }
    ]

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama3-70b-8192",
        "messages": messages,
        "max_tokens": 800,
        "temperature": 0.7
    }

    response = requests.post(API_URL, headers=headers, json=payload)
    response.raise_for_status()

    raw_output = response.json()["choices"][0]["message"]["content"]

    # Extract JSON block from markdown (e.g., ```json ... ```)
    try:
        json_string = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_output, re.DOTALL).group(1)
    except AttributeError:
        # Try fallback: remove any ``` and strip
        json_string = raw_output.strip("` \n")

    try:
        return json.loads(json_string)
    except json.JSONDecodeError as e:
        print("Failed to decode JSON:", e)
        print("Raw output:\n", raw_output)
        raise

