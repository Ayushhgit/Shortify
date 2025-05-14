from fastapi import FastAPI
from chatbot.routes import chatbot_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import logging

# Import our new shorts router
from app.routers import shorts
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Initialize FastAPI app
app = FastAPI(
    title="Shortify AI",
    description="Backend for generating viral short clips from YouTube videos",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Keep your existing origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for storing video uploads and clips
app.mount(
    "/uploads",
    StaticFiles(directory=Path("uploads")),
    name="uploads"
)

# Include your existing chatbot router
app.include_router(chatbot_router)

# Include our new shorts router
app.include_router(
    shorts.router, 
    prefix="/api/shorts", 
    tags=["shorts"]
)

# Default route
@app.get("/", tags=["status"])
async def root():
    return {
        "message": "Shortify AI API",
        "docs": "/docs",
        "status": "operational"
    }

# Health check endpoint
@app.get("/health", tags=["status"])
async def health():
    return {"status": "healthy"}
