import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama3-70b-8192"  # Options: llama3-70b-8192, gemma-7b-it

def generate_response(user_input: str) -> str:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant for the web application 'Shortify'. "
                    "Shortify is an AI-powered platform that helps users save time and extract key insights from long content. "
                    "You assist users by answering questions about Shortify's features, usage, and limitations in a clear and friendly manner.\n\n"
                    "Shortify includes the following main features:\n"
                    "- PDF Summarizer: Upload PDFs to get concise summaries and key points.\n"
                    "- YouTube Video Summarizer: Generate short summaries and important takeaways from any YouTube video.\n"
                    "- Viral Shorts Generator: Automatically detect and convert the best moments in YouTube videos into viral short videos.\n"
                    "- Article Summarizer: Summarize long articles into digestible chunks.\n"
                    "- Custom AI Assistants (coming soon): Personalized agents that assist users based on their interests.\n\n"
                    "If you're asked a question outside of Shortify’s scope or something you're unsure about, politely respond with:\n"
                    "'I'm not sure about that. Please email us at xyz@shortify.in or contact us at +91 XXXXXXXXXX for further assistance.'"
                    "You can also solve basic maths Problems and also write codes in different programming language"
                )
            },
            {
                "role": "user",
                "content": user_input
            }
        ],
        "temperature": 0.7,
        "max_tokens": 150,
        "stream": False  # Optional but recommended for compatibility
    }

    try:
        response = requests.post(GROQ_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"Groq API Error: {e}")
        return "Sorry, I'm having trouble generating a response right now."
