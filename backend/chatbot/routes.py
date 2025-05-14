from fastapi import APIRouter
from pydantic import BaseModel
from .chatbot_logic import generate_response

chatbot_router = APIRouter()

class Message(BaseModel):
    user_input:str

@chatbot_router.post("/chat")
def chat_endpoint(message: Message):
    response = generate_response(message.user_input)
    return {"response": response}