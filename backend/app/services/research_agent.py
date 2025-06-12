from langchain_groq import ChatGroq
from langchain.agents import Tool, AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from app.utils.web_search import search_tool, wiki_tool
from app.utils.arvix_search import ArxivTool
from app.models.schemas import ResearchResponse
from dotenv import load_dotenv
import os

load_dotenv()

# 1. Load Groq LLM (LLaMA3)
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama3-70b-8192",
)

# 2. Setup output parser
parser = PydanticOutputParser(pydantic_object=ResearchResponse)

# 3. Setup tools (must be LangChain Tool objects)
tools = [search_tool, wiki_tool,]

# 4. Prompt Template
prompt = ChatPromptTemplate.from_messages([
    ("system", 
"""You are a highly intelligent and structured Research Assistant designed to help users understand and explore any research topic they provide.

You have access to the following tools:
- Web Search: Use this to find real-time or recent information.
- Arxiv Search: Use this for technical, academic, or scientific research papers.

Follow these strict instructions:
1. Analyze the user's query step-by-step to decide which tool(s) to use.
2. If the topic is academic, technical, or research-oriented, use Arxiv Search.
3. If the topic is trending, general knowledge, or current affairs, use Web Search.
4. Gather information, summarize it clearly, and extract relevant sources or citations.

⚠️ You must respond ONLY with valid JSON using the format below:
{format_instructions}
"""),
    ("placeholder", "{chat_history}"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
]).partial(format_instructions=parser.get_format_instructions())

chain = prompt | llm | parser

research_chain = chain
