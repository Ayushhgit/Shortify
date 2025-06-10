# export.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List
from fpdf import FPDF
import uuid
import os
import zipfile
import io

router = APIRouter(prefix="/export", tags=["Export System"])

@router.get("/image/{image_path:path}")
async def get_image(image_path: str):
    full_path = f"outputs/{image_path}"
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(full_path)

@router.post("/pdf")
async def export_to_pdf(image_paths: List[str]):
    if not image_paths:
        raise HTTPException(status_code=400, detail="No images provided")
    
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    for img_path in image_paths:
        full_path = f"outputs/{img_path}"
        if not os.path.exists(full_path):
            continue
            
        pdf.add_page()
        pdf.image(full_path, x=10, y=10, w=190)  # A4 size
        
    output_path = f"outputs/{uuid.uuid4()}.pdf"
    pdf.output(output_path)
    
    return {"pdf_path": output_path}

@router.post("/zip")
async def export_zip(image_paths: List[str]):
    if not image_paths:
        raise HTTPException(status_code=400, detail="No images provided")
    
    zip_filename = f"outputs/{uuid.uuid4()}.zip"
    
    with zipfile.ZipFile(zip_filename, 'w') as zipf:
        for img_path in image_paths:
            full_path = f"outputs/{img_path}"
            if os.path.exists(full_path):
                zipf.write(full_path, os.path.basename(full_path))
    
    return {"zip_path": zip_filename}