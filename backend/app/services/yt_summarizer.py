import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def generate_summary(transcript: str, details: dict = None) -> str:
    # Configure Gemini API
    genai.configure(api_key=os.getenv("GOOGLE_AI_API_KEY"))
    
    # Create the model
    model = genai.GenerativeModel(model_name="gemini-2.5-flash")
    
    # Build context from video details
    context = ""
    if details:
        context += f"Video Title: {details.get('title', 'Unknown')}\n"
        context += f"Channel: {details.get('channelName', 'Unknown')}\n"
        if details.get('duration'):
            duration_mins = details['duration'] // 60
            context += f"Duration: {duration_mins} minutes\n"
        if details.get('publishDate'):
            context += f"Published: {details['publishDate']}\n"
        context += "\n"
    
    # Enhanced prompt with context and structured output
    prompt = f"""You are an expert content analyst specializing in YouTube video summarization. Your task is to create a comprehensive yet concise summary that captures the essence and key insights of the video.

{context}**Instructions:**
1. Analyze the video content in relation to its title and context
2. Identify the main topic, key points, and important insights
3. Structure your summary with clear sections
4. Highlight actionable takeaways if applicable
5. Maintain an engaging and informative tone
6. Keep the summary between 200-400 words

**Video Transcript:**
{transcript[:12000]}

**Please provide a well-structured summary that includes:**
- Main topic and purpose of the video
- Key points and insights discussed
- Important conclusions or takeaways
- Any notable quotes or statistics mentioned

Format your response as a coherent summary without bullet points unless absolutely necessary."""
    
    # Generate the summary
    response = model.generate_content(prompt)
    
    return response.text