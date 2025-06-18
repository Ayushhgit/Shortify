from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from grpc import Status
import pandas as pd
import io
import os
import tempfile
from app.utils.eda_engine import EDAEngine
from app.core.rate_limiting import data_analysis_rate_limit

router = APIRouter(prefix="/eda", tags=["EDA"])

@router.post("/analyze")
async def analyze_dataset(
    file: UploadFile = File(...),
    rate_limit_data: dict = Depends(data_analysis_rate_limit)
):
    """Analyze uploaded dataset and return EDA insights"""
    try:
        user = rate_limit_data['user']
        rate_info = rate_limit_data['rate_limit_info']
        
        # Validate file type
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(
                status_code=400, 
                detail="Only CSV and Excel files are supported"
            )
        
        # Validate file size (e.g., 50MB limit for data files)
        content = await file.read()
        if len(content) > 50 * 1024 * 1024:  # 50MB
            raise HTTPException(
                status_code=400,
                detail="File size too large. Maximum 50MB allowed."
            )
        
        # Load dataset based on file type
        try:
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content), encoding='utf-8')
            else:
                df = pd.read_excel(io.BytesIO(content))
        except UnicodeDecodeError:
            # Try different encoding for CSV
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content), encoding='latin-1')
            else:
                raise HTTPException(
                    status_code=400, 
                    detail="Unable to read the file. Please check the file format."
                )
        
        # Basic validation
        if df.empty:
            raise HTTPException(status_code=400, detail="The uploaded file is empty")
        
        if len(df.columns) == 0:
            raise HTTPException(status_code=400, detail="No columns found in the dataset")
        
        # Validate dataset size (e.g., max 100k rows for performance)
        if len(df) > 100000:
            raise HTTPException(
                status_code=400,
                detail="Dataset too large. Maximum 100,000 rows allowed."
            )
        
        # Initialize EDA Engine
        eda_engine = EDAEngine(df)
        
        # Generate analysis
        analysis_result = eda_engine.generate_analysis()
        
        # Add usage info to response
        if isinstance(analysis_result, dict):
            analysis_result["usage_info"] = {
                "remaining": rate_info['remaining'],
                "limit": rate_info['limit'],
                "subscription": rate_info['subscription']
            }
        else:
            # If analysis_result is not a dict, wrap it
            analysis_result = {
                "analysis": analysis_result,
                "usage_info": {
                    "remaining": rate_info['remaining'],
                    "limit": rate_info['limit'],
                    "subscription": rate_info['subscription']
                }
            }
        
        return analysis_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=Status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze dataset: {str(e)}"
        )

@router.post("/report")
async def generate_report(file: UploadFile = File(...)):
    """Generate comprehensive EDA report using ydata-profiling"""
    try:
        # Validate file type
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        # Read file content
        content = await file.read()
        
        # Load dataset based on file type
        try:
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content), encoding='utf-8')
            else:
                df = pd.read_excel(io.BytesIO(content))
        except UnicodeDecodeError:
            # Try different encoding for CSV
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content), encoding='latin-1')
            else:
                raise HTTPException(status_code=400, detail="Unable to read the file. Please check the file format.")
        
        # Basic validation
        if df.empty:
            raise HTTPException(status_code=400, detail="The uploaded file is empty")
        
        if len(df.columns) == 0:
            raise HTTPException(status_code=400, detail="No columns found in the dataset")
        
        # Initialize EDA Engine
        eda_engine = EDAEngine(df)
        
        # Generate HTML report
        report_path = eda_engine.generate_html_report()
        
        return FileResponse(
            path=report_path,
            filename="eda_report.html",
            media_type="text/html"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "EDA service is running"}