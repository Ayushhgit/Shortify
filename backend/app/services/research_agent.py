# research_agent.py

import threading
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain.agents import AgentExecutor, create_tool_calling_agent
from dotenv import load_dotenv
import os
import logging
import signal
from contextlib import contextmanager

from app.models.schemas import ResearchResponse
from app.utils.web_search import search_tool, wiki_tool
from app.utils.arvix_search import arxiv_tool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Groq setup
llm = ChatGroq(
    api_key=os.getenv("GROQ_RESEARCH_KEY"),
    model="llama3-70b-8192",
    temperature=0
)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Initialize tools
tools = [wiki_tool, search_tool, arxiv_tool]

# Output schema
parser = PydanticOutputParser(pydantic_object=ResearchResponse)

# Enhanced prompt template for tool-calling agent
prompt = ChatPromptTemplate.from_messages([
    ("system", 
     f"""
You are a conversational Research Assistant. You maintain context across the conversation and can:
- Continue discussing the same topic in depth
- Answer follow-up questions
- Clarify previous responses
- Provide additional details when asked

Previous conversation context is available in chat_history.
Use the conversation history to provide contextually relevant responses.

When the user asks follow-up questions, refer to previous responses and build upon them.
If the user asks about a new topic, research it normally but acknowledge the topic change.

Your tools remain the same:
- wiki_tool: For general knowledge
- search_tool: For real-time web search  
- arxiv_tool: For academic papers

Do not give any bold heading or sub topic bold heading just give the answer. Keep responses conversational and build on previous context when relevant.
     """),
    ("placeholder", "{chat_history}"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
])

# Create agent with tool calling - with fallback to ReAct agent
agent_executor = None

try:
    # First try tool calling agent (if supported)
    from langchain.agents import create_tool_calling_agent
    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(
        agent=agent, 
        tools=tools, 
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=5
    )
    logger.info("Successfully created tool-calling agent")
except Exception as e:
    logger.warning(f"Tool-calling agent failed: {e}, trying ReAct agent")
    
    # Fallback to ReAct agent
    try:
        from langchain.agents import create_react_agent
        
        # ReAct specific prompt - simplified and focused
        react_prompt = ChatPromptTemplate.from_messages([
            ("system", 
             """
You are a research assistant. Use tools efficiently to answer questions.

Available tools: {tools}
Tool names: {tool_names}

Format:
Question: {input}
Thought: I need to research this topic
Action: [choose ONE tool from {tool_names}]
Action Input: [search query]
Observation: [result]
Thought: I have enough information to answer
Final Answer: [comprehensive answer with topic, summary, and sources]

For technical topics like transformers/attention mechanisms, use arxiv_tool.
For general knowledge, use wiki_tool.
Use ONLY ONE tool per query to avoid loops.

{agent_scratchpad}
             """),
        ])
        
        agent = create_react_agent(llm, tools, react_prompt)
        agent_executor = AgentExecutor(
            agent=agent, 
            tools=tools, 
            verbose=False,  # Reduce verbosity
            handle_parsing_errors=True,
            max_iterations=3,  # Reduce max iterations  
            max_execution_time=30,  # Add time limit
            early_stopping_method="generate"
        )
        logger.info("Successfully created ReAct agent")
    except Exception as e2:
        logger.error(f"ReAct agent also failed: {e2}")
        agent_executor = None

# Redis-based Memory with error handling
def get_memory(session_id: str = "default-session"):
    try:
        return ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            chat_memory=RedisChatMessageHistory(
                url=REDIS_URL,
                session_id=session_id  # Use dynamic session ID
            )
        )
    except Exception as e:
        logger.warning(f"Redis memory failed, using in-memory: {e}")
        return ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

# Alternative: Simple LLM Chain with manual tool orchestration
def create_simple_research_chain():
    """Create a simple research chain without agents as ultimate fallback"""
    
    research_prompt = ChatPromptTemplate.from_messages([
        ("system", """
You are a research assistant. Based on the user's query, determine which research approach to take:

1. For academic/scientific topics: Use ArXiv search
2. For general knowledge: Use Wikipedia
3. For current events/trends: Use web search

Analyze the query and provide a comprehensive research response.

Query: {query}

Available information from tools:
{tool_results}

Provide a structured response with:
- Topic identification
- Summary of findings 
- Key insights
- Sources used
         """),
        ("human", "{query}")
    ])
    
    return research_prompt | llm

# Create the simple chain as backup
simple_chain = create_simple_research_chain()

@contextmanager
def timeout_context(seconds):
    """Cross-platform timeout using threading.Timer (safe on Windows)"""
    timer = threading.Timer(seconds, lambda: (_ for _ in ()).throw(TimeoutError(f"Operation timed out after {seconds} seconds")))
    timer.start()
    try:
        yield
    finally:
        timer.cancel()


redis_memory = get_memory()

def run_simple_research_chain(user_input: str) -> ResearchResponse:
    """
    Use simple LLM chain with manual tool orchestration as a reliable fallback.
    """
    try:
        # Determine which tool to use based on query (pick ONE tool for efficiency)
        query_lower = user_input.lower()
        tool_result = None
        source_used = None
        
        # For technical/academic queries - prioritize ArXiv
        if any(term in query_lower for term in [
            'attention', 'transformer', 'neural', 'model', 'algorithm',
            'research', 'paper', 'study', 'academic', 'scientific', 
            'theory', 'experiment', 'analysis', 'methodology', 'machine learning',
            'deep learning', 'ai', 'artificial intelligence'
        ]):
            try:
                logger.info("Using ArXiv for technical query")
                tool_result = arxiv_tool._run(user_input)
                source_used = "ArXiv Academic Papers"
            except Exception as e:
                logger.warning(f"ArXiv search failed: {e}")
        
        # If ArXiv didn't work or wasn't triggered, try Wikipedia
        if not tool_result:
            try:
                logger.info("Using Wikipedia for general knowledge")
                tool_result = wiki_tool._run(user_input)
                source_used = "Wikipedia"
            except Exception as e:
                logger.warning(f"Wikipedia search failed: {e}")
        
        # If Wikipedia didn't work, try web search as last resort
        if not tool_result:
            try:
                logger.info("Using web search as fallback")
                tool_result = search_tool._run(user_input)
                source_used = "Web Search"
            except Exception as e:
                logger.error(f"All tools failed: {e}")
                return ResearchResponse(
                    topic=user_input,
                    summary="I apologize, but I'm unable to research this topic right now due to technical issues with the search tools.",
                    sources=[]
                )
        
        # Use LLM to synthesize the information
        response = simple_chain.invoke({
            "query": user_input,
            "tool_results": tool_result
        })
        
        # Parse the LLM response
        llm_output = response.content if hasattr(response, 'content') else str(response)
        
        return ResearchResponse(
            topic=user_input,
            summary=llm_output,
            sources=[source_used] if source_used else []
        )
        
    except Exception as e:
        logger.error(f"Simple research chain failed: {e}")
        return ResearchResponse(
            topic=user_input,
            summary=f"Research encountered an error: {str(e)}",
            sources=[]
        )
def run_research_agent(user_input: str, session_id: str = "default-session") -> ResearchResponse:
    try:
        # Get session-specific memory
        session_memory = get_memory(session_id)
        
        if agent_executor:
            try:
                logger.info(f"Using agent executor for query: {user_input}")
                
                with timeout_context(45):
                    # Load conversation history
                    memory_variables = session_memory.load_memory_variables({})
                    
                    agent_input = {
                        "input": user_input,
                        **memory_variables
                    }
                    
                    result = agent_executor.invoke(agent_input)
                    agent_output = result.get("output", "")
                
                if agent_output and not agent_output.startswith("Agent stopped"):
                    research_response = ResearchResponse(
                        topic=user_input,
                        summary=agent_output,
                        sources=["Agent Research"]
                    )
                    
                    # Save conversation to memory
                    session_memory.save_context(
                        {"input": user_input}, 
                        {"output": research_response.summary}
                    )
                    
                    return research_response
                    
            except Exception as agent_error:
                logger.warning(f"Agent executor failed: {agent_error}")
        
        # Fallback to simple chain...
        result = run_simple_research_chain(user_input)
        
        # Save to session memory
        session_memory.save_context(
            {"input": user_input}, 
            {"output": result.summary}
        )
        
        return result
        
    except Exception as e:
        logger.error(f"All research strategies failed for '{user_input}': {e}")
        # Return basic error response
        return ResearchResponse(
            topic=user_input,
            summary=f"I encountered technical difficulties while researching this topic. Please try again later. Error: {str(e)}",
            sources=[]
        )

# Alternative function for direct tool usage (if agent fails)
def run_direct_research(user_input: str) -> ResearchResponse:
    """
    Fallback function that uses tools directly without the agent framework.
    """
    try:
        # Simple heuristic for tool selection
        query_lower = user_input.lower()
        
        results = []
        sources = []
        
        # Use arxiv for academic queries
        if any(term in query_lower for term in ['research', 'paper', 'study', 'academic', 'scientific']):
            try:
                arxiv_result = arxiv_tool._run(user_input)
                results.append(f"Academic Research: {arxiv_result}")
                sources.append("ArXiv")
            except:
                pass
        
        # Use web search for current/general topics
        try:
            search_result = search_tool._run(user_input)
            results.append(f"Web Search: {search_result}")
            sources.append("Web Search")
        except:
            pass
        
        # Use wiki for general knowledge
        try:
            wiki_result = wiki_tool._run(user_input)
            results.append(f"Wikipedia: {wiki_result}")
            sources.append("Wikipedia")
        except:
            pass
        
        summary = "\n\n".join(results) if results else "No results found for this query."
        
        return ResearchResponse(
            topic=user_input,
            summary=summary,
            sources=sources
        )
        
    except Exception as e:
        return ResearchResponse(
            topic=user_input,
            summary=f"Research failed: {str(e)}",
            sources=[]
        )