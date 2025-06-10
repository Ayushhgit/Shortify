from fastapi import FastAPI
from chatbot.routes import chatbot_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.database import Base, engine
from pathlib import Path
import logging
from app.models import user 
from app.routers import payment
from app.routers import shorts
from app.routers import auth_router
from app.routers import RA_router
from app.routers import pdf_router
from app.routers.export_share import router as export_share_router
from app.routers import ytSumm_router
from app.routers.article_router import router as article_router
from app.routers.review_router import router as review_router
from app.routers import cover_letter_router
from app.routers import resumeParser_router 
from app.models.user import User
from app.models.review import Review
from app.routers import ai_solver
from app.routers import export 
from app.routers import handwriting



logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(
    title="Shortify AI",
    description="Backend for generating viral short clips from YouTube videos",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("uploads").mkdir(exist_ok=True)
Path("outputs").mkdir(exist_ok=True)
Path("fonts").mkdir(exist_ok=True)
Path("static").mkdir(exist_ok=True)


app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory=Path("uploads")), name="uploads")
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

app.include_router(ytSumm_router.router)
app.include_router(payment.router)
app.include_router(auth_router.router)
app.include_router(chatbot_router)
app.include_router(shorts.router, prefix="/api/shorts", tags=["shorts"])
app.include_router(RA_router.router)
app.include_router(pdf_router.router)
app.include_router(export_share_router)
app.include_router(review_router)
app.include_router(article_router)
app.include_router(resumeParser_router.router)
app.include_router(cover_letter_router.router)
app.include_router(ai_solver.router)
app.include_router(export.router)
app.include_router(handwriting.router)

@app.get("/", tags=["status"])
async def root():
    return {
        "message": "Shortify AI API",
        "docs": "/docs",
        "status": "operational"
    }

@app.get("/health", tags=["status"])
async def health():
    return {"status": "healthy"}
#hi


print("Creating tables...")
Base.metadata.create_all(bind=engine)