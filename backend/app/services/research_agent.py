from fastapi import HTTPException, APIRouter
from pydantic import BaseModel
from langchain_community.chat_models import ChatOpenAI
from langchain.agents import initialize_agent, Tool
from langchain.agents.agent_types import AgentType
from app.utils.web_search import WebSearchTool
from app.utils.arvix_search import ArxivTool
from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatOpenAI(
    openai_api_key=os.getenv("GROQ_API_KEY"),
    openai_api_base="https://api.groq.com/openai/v1",
    model="llama3-70b-8192",  # or any other Groq-supported model
)

# Wrap your tools
tools = [
    Tool(name="Web Search", func=WebSearchTool().run, description="Useful for searching the web"),
    Tool(name="Arxiv Search", func=ArxivTool().run, description="Finds papers on Arxiv"),
]

agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

class QueryRequest(BaseModel):
    query: str

# Create router
router = APIRouter()

@router.post("/agent/query")
async def run_agent(req: QueryRequest):
    try:
        result = agent.run(req.query)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))