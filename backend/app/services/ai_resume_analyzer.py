import os
import requests
import json
import re
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GROQ_RESUME_KEY")
API_URL = "https://api.groq.com/openai/v1/chat/completions"

def analyze_resume(text: str, role: str):
    messages = [
        {
            "role": "system",
            "content": (
                "You are a professional resume reviewer with expertise in recruiting and talent acquisition. "
                "Your job is to evaluate resumes for specific job roles, focusing on skills, experiences, and overall presentation. "
                "Return output ONLY in valid raw JSON format without any explanation, comments, or markdown."
            )
        },
        {
            "role": "user",
            "content": f"""
The user is applying for a {role} role.
Here is their full resume text:
\"\"\"{text}\"\"\"

Please perform a detailed and structured evaluation of this resume tailored for the {role} role, and return a JSON object that includes the following fields:

1. "score": A numeric value from 0 to 100 that reflects the overall suitability of the resume for the given role, based on skills match, relevant experience, clarity, and professionalism.

2. "strengths": A list of the key strengths found in the resume. These may include relevant skills, certifications, accomplishments, clarity of communication, technical expertise, or other positive aspects.

3. "improvements": A list of actionable recommendations to improve the resume. This could include missing skills, formatting suggestions, adding measurable achievements, improving clarity, or tailoring content for the role.

4. "summary": A concise textual summary (2-3 sentences) that synthesizes the resume's overall fit for the role, highlighting major points from the evaluation.

5. "keywords": A list of important keywords and skills extracted from the resume that are relevant to the {role} position.

6. "matchedSkills": The number of key skills that the resume demonstrates which match typical required skills for the {role} role.

7. "totalSkills": The estimated total number of relevant skills for the {role} role that should ideally be present.

8. "recommendedSkills": A list of additional skills or certifications that are recommended for the candidate to acquire or highlight, to increase suitability for the {role} role.

Additional instructions:
- Base your evaluation on typical industry standards and requirements for the {role} role.
- Consider technical skills, soft skills, experience relevance, certifications, and education.
- Ignore any personal data like name, address, or contact info.
- Return ONLY the raw JSON response exactly in the format requested.

Example of expected JSON output:

{{
  "score": 85,
  "strengths": [
    "Strong proficiency in Python and Java",
    "Experience with REST APIs and microservices",
    "Clear presentation of project outcomes with metrics"
  ],
  "improvements": [
    "Include more leadership or teamwork examples",
    "Add certifications related to cloud platforms",
    "Improve formatting consistency in the skills section"
  ],
  "summary": "The resume shows solid technical skills relevant for the {role} role with practical project experience, but can be enhanced by highlighting leadership and obtaining cloud certifications.",
  "keywords": ["Python", "Java", "REST API", "Microservices", "Agile", "Docker"],
  "matchedSkills": 6,
  "totalSkills": 8,
  "recommendedSkills": ["AWS Certification", "Team Leadership", "CI/CD Pipelines"]
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

