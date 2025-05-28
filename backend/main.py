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


app.mount("/uploads", StaticFiles(directory=Path("uploads")), name="uploads")

app.include_router(payment.router)
app.include_router(auth_router.router)
app.include_router(chatbot_router)
app.include_router(shorts.router, prefix="/api/shorts", tags=["shorts"])
app.include_router(RA_router.router)

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