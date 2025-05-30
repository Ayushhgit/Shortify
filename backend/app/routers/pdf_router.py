from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.pdf_service import PDFService
from datetime import datetime

router = APIRouter(prefix="/api/pdf", tags=["PDF Processing"])
pdf_service = PDFService()

def validate_pdf_file(file: UploadFile) -> dict:
    if not file.filename.lower().endswith('.pdf'):
        return {"valid": False, "error": "File must be a PDF"}
    return {"valid": True}

@router.post("/upload-analyze")
async def upload_and_analyze_pdf(
    file: UploadFile = File(...),
    analysis_type: str = Form(default="summary"),
    role: str = Form(default=None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        validation = validate_pdf_file(file)
        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=validation["error"])

        result = await pdf_service.analyze_document_complete(file, analysis_type, role)

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Analysis failed"))

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing PDF: {str(e)}")

@router.post("/chat-simple")
async def chat_with_document_simple(
    request: dict,  # {"message": "user message", "document_content": "extracted text"}
    current_user: dict = Depends(get_current_user),
):
    try:
        message = request.get("message", "").strip()
        document_content = request.get("document_content", "").strip()
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        if not document_content:
            raise HTTPException(status_code=400, detail="Document content is required")
        
        reply = pdf_service.chat_with_document(message, document_content)
        return {"response": reply, "timestamp": datetime.utcnow().isoformat()}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.post("/chat")
async def chat_with_pdf(
    current_user: dict = Depends(get_current_user),
    file: UploadFile = File(None),  # Make file optional
    message: str = Form(...),
    document_content: str = Form(None),  # Add document_content as form field
):
    try:
        if file:
            # Original file upload logic
            validation = validate_pdf_file(file)
            if not validation["valid"]:
                raise HTTPException(status_code=400, detail=validation["error"])

            # Save temp file
            import uuid, aiofiles, os
            temp_path = f"temp/{uuid.uuid4()}_{file.filename}"
            os.makedirs("temp", exist_ok=True)
            async with aiofiles.open(temp_path, "wb") as f:
                content = await file.read()
                await f.write(content)

            # Extract text
            text_content, _ = pdf_service.extract_text_from_pdf(temp_path)
            os.remove(temp_path)
        elif document_content:
            # Use provided document content
            text_content = document_content
        else:
            raise HTTPException(status_code=400, detail="Either file or document_content must be provided")

        if not text_content.strip():
            raise HTTPException(status_code=400, detail="No text content found")

        reply = pdf_service.chat_with_document(message, text_content)
        return {"response": reply, "timestamp": datetime.utcnow().isoformat()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.get("/my-analyses")
async def get_user_analyses(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return {"analyses": await pdf_service.get_user_analyses(db, current_user.get("id"))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analyses: {str(e)}")

@router.delete("/analysis/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        deleted = await pdf_service.delete_analysis(db, analysis_id, current_user.get("id"))
        if not deleted:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return {"message": "Analysis deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete analysis: {str(e)}")
