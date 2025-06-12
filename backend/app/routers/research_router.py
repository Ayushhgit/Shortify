from fastapi import HTTPException, APIRouter
from app.models.schemas import QueryRequest
from app.services.research_agent import research_chain, parser

router = APIRouter()

@router.post("/agent/query")
async def run_agent(req: QueryRequest):
    try:
        output = research_chain.invoke({"input": req.query})

        return {
            "topic": output.topic,
            "summary": output.summary,
            "sources": output.sources
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
