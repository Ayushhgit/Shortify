from openai import OpenAI
import os

client = OpenAI(api_key="API_KEY")

def generate_response(user_input: str) -> str:
    try:
        chat_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_input}
            ],
            temperature=0.7,
            max_tokens=150
        )
        return chat_response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return "Sorry, I'm having trouble generating a response right now."
