from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import json
import uuid
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Create router for export and share endpoints
router = APIRouter(tags=["Export & Share"])

# In-memory storage for shared reports (for demo purposes)
shared_reports = {}

def clean_text(text):
    """Clean text to avoid ReportLab encoding issues"""
    if not text:
        return ""
    # Remove or replace problematic characters
    import re
    # Replace smart quotes and other problematic characters
    replacements = {
        '"': '"', '"': '"', ''': "'", ''': "'",
        '–': '-', '—': '-', '…': '...'
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    # Remove any remaining non-ASCII characters that might cause issues
    text = re.sub(r'[^\x00-\x7F]+', '?', str(text))
    return text

@router.post("/api/export/pdf")
async def export_to_pdf(request: Request):
    """Export analysis report to PDF"""
    try:
        # Get JSON data from request body
        request_data = await request.json()
        
        summary = clean_text(request_data.get('summary', ''))
        analysis_data = request_data.get('analysisData', {})
        file_name = clean_text(request_data.get('fileName', 'document'))
        
        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter,
            topMargin=1*inch,
            bottomMargin=1*inch,
            leftMargin=1*inch,
            rightMargin=1*inch
        )
        
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title = Paragraph(f"Analysis Report: {file_name}", styles['Title'])
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Generated timestamp
        timestamp = Paragraph(
            f"Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", 
            styles['Normal']
        )
        story.append(timestamp)
        story.append(Spacer(1, 20))
        
        # Summary Section
        if summary:
            story.append(Paragraph("Executive Summary", styles['Heading1']))
            story.append(Spacer(1, 12))
            story.append(Paragraph(summary, styles['Normal']))
            story.append(Spacer(1, 20))
        
        # Analysis Details Section
        if analysis_data:
            story.append(Paragraph("Analysis Details", styles['Heading1']))
            story.append(Spacer(1, 12))
            
            # Document Metrics
            story.append(Paragraph("Document Metrics", styles['Heading2']))
            story.append(Spacer(1, 8))
            
            metrics = [
                f"Word Count: {analysis_data.get('word_count', 'N/A')}",
                f"Character Count: {analysis_data.get('character_count', 'N/A')}",
                f"Page Count: {analysis_data.get('page_count', 'N/A')}",
                f"Estimated Reading Time: {analysis_data.get('reading_time_minutes', 'N/A')} minutes",
                f"Document Complexity: {clean_text(str(analysis_data.get('complexity', 'N/A')))}",
                f"Document Type: {clean_text(str(analysis_data.get('document_type', 'N/A')))}",
                f"Sentiment: {clean_text(str(analysis_data.get('sentiment', 'N/A')))}"
            ]
            
            for metric in metrics:
                try:
                    story.append(Paragraph(f"• {metric}", styles['Normal']))
                except Exception as e:
                    logger.warning(f"Skipping metric due to encoding issue: {metric}, Error: {e}")
                    continue
            
            story.append(Spacer(1, 16))
            
            # Scores Section
            if any(key in analysis_data for key in ['technical_score', 'business_score', 'academic_score']):
                story.append(Paragraph("Content Scores", styles['Heading2']))
                story.append(Spacer(1, 8))
                
                scores = [
                    ("Technical Score", analysis_data.get('technical_score', 0)),
                    ("Business Score", analysis_data.get('business_score', 0)),
                    ("Academic Score", analysis_data.get('academic_score', 0))
                ]
                
                for score_name, score_value in scores:
                    try:
                        story.append(Paragraph(f"• {score_name}: {score_value}/100", styles['Normal']))
                    except Exception as e:
                        logger.warning(f"Skipping score due to error: {score_name}, Error: {e}")
                        continue
                
                story.append(Spacer(1, 16))
            
            # Topics Section
            topics = analysis_data.get('topics', [])
            if topics and isinstance(topics, list):
                story.append(Paragraph("Key Topics", styles['Heading2']))
                story.append(Spacer(1, 8))
                for topic in topics:
                    try:
                        clean_topic = clean_text(str(topic))
                        story.append(Paragraph(f"• {clean_topic}", styles['Normal']))
                    except Exception as e:
                        logger.warning(f"Skipping topic due to error: {topic}, Error: {e}")
                        continue
                story.append(Spacer(1, 16))
            
            # Key Points Section
            key_points = analysis_data.get('key_points', [])
            if key_points and isinstance(key_points, list):
                story.append(Paragraph("Key Points", styles['Heading2']))
                story.append(Spacer(1, 8))
                for point in key_points:
                    try:
                        clean_point = clean_text(str(point))
                        story.append(Paragraph(f"• {clean_point}", styles['Normal']))
                    except Exception as e:
                        logger.warning(f"Skipping key point due to error: {point}, Error: {e}")
                        continue
                story.append(Spacer(1, 16))
            
            # Resume-specific sections
            if 'score' in analysis_data:
                story.append(Paragraph("Resume Analysis", styles['Heading2']))
                story.append(Spacer(1, 8))
                
                try:
                    story.append(Paragraph(f"Overall Score: {analysis_data.get('score', 0)}/100", styles['Normal']))
                    story.append(Paragraph(f"Experience Years: {analysis_data.get('experience_years', 0)}", styles['Normal']))
                    story.append(Paragraph(f"Matched Skills: {analysis_data.get('matchedSkills', 0)}/{analysis_data.get('totalSkills', 0)}", styles['Normal']))
                    story.append(Spacer(1, 12))
                except Exception as e:
                    logger.warning(f"Error in resume metrics: {e}")
                
                # Strengths
                strengths = analysis_data.get('strengths', [])
                if strengths and isinstance(strengths, list):
                    story.append(Paragraph("Strengths:", styles['Heading3']))
                    for strength in strengths:
                        try:
                            clean_strength = clean_text(str(strength))
                            story.append(Paragraph(f"• {clean_strength}", styles['Normal']))
                        except Exception as e:
                            logger.warning(f"Skipping strength due to error: {strength}, Error: {e}")
                            continue
                    story.append(Spacer(1, 12))
                
                # Improvements
                improvements = analysis_data.get('improvements', [])
                if improvements and isinstance(improvements, list):
                    story.append(Paragraph("Areas for Improvement:", styles['Heading3']))
                    for improvement in improvements:
                        try:
                            clean_improvement = clean_text(str(improvement))
                            story.append(Paragraph(f"• {clean_improvement}", styles['Normal']))
                        except Exception as e:
                            logger.warning(f"Skipping improvement due to error: {improvement}, Error: {e}")
                            continue
                    story.append(Spacer(1, 12))
                
                # Recommended Skills
                recommended_skills = analysis_data.get('recommendedSkills', [])
                if recommended_skills and isinstance(recommended_skills, list):
                    story.append(Paragraph("Recommended Skills:", styles['Heading3']))
                    for skill in recommended_skills:
                        try:
                            clean_skill = clean_text(str(skill))
                            story.append(Paragraph(f"• {clean_skill}", styles['Normal']))
                        except Exception as e:
                            logger.warning(f"Skipping skill due to error: {skill}, Error: {e}")
                            continue
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Clean filename for download
        clean_filename = "".join(c for c in file_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        if not clean_filename:
            clean_filename = "analysis"
        
        # Read buffer content
        pdf_content = buffer.read()
        
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={clean_filename}_analysis.pdf"}
        )
        
    except Exception as e:
        logger.error(f"Export error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.post("/api/share")
async def share_report(request: Request):
    """Generate shareable link for analysis report"""
    try:
        # Get JSON data from request body
        request_data = await request.json()
        
        summary = request_data.get('summary', '')
        analysis_data = request_data.get('analysisData', {})
        file_name = request_data.get('fileName', 'document')
        
        # Generate a unique share ID
        share_id = str(uuid.uuid4())
        
        # Store in memory (temporary solution)
        shared_reports[share_id] = {
            "summary": summary,
            "analysisData": analysis_data,
            "fileName": file_name,
            "createdAt": datetime.utcnow().isoformat(),
            "expiresAt": datetime.utcnow().timestamp() + 7*24*3600  # 7 days from now
        }
        
        # Determine the base URL dynamically
        base_url = str(request.base_url).rstrip('/')
        share_url = f"{base_url}/shared/{share_id}"
        
        return {
            "shareUrl": share_url,
            "shareId": share_id,
            "expiresAt": shared_reports[share_id]["expiresAt"],
            "message": "Share link generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Share error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Share failed: {str(e)}")

@router.get("/shared/{share_id}")
async def get_shared_report(share_id: str):
    """Retrieve a shared report by ID"""
    try:
        if share_id not in shared_reports:
            raise HTTPException(status_code=404, detail="Share link not found")
        
        report = shared_reports[share_id]
        
        # Check if expired
        if datetime.utcnow().timestamp() > report["expiresAt"]:
            # Clean up expired report
            del shared_reports[share_id]
            raise HTTPException(status_code=404, detail="Share link has expired")
        
        return {
            "summary": report["summary"],
            "analysisData": report["analysisData"],
            "fileName": report["fileName"],
            "createdAt": report["createdAt"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving shared report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve shared report: {str(e)}")