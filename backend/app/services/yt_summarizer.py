import os
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

def generate_summary(transcript: str) -> str:
    prompt = PromptTemplate.from_template(
        "You are a helpful assistant. Summarize the following YouTube video transcript:\n\n{transcript}"
    )

    llm = ChatGroq(
        temperature=0.2,
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model_name="meta-llama/llama-4-scout-17b-16e-instruct"
    )

    chain = prompt | llm | StrOutputParser()
    result = chain.invoke({"transcript": transcript[:10000]})  # Trim if too long
    return result
