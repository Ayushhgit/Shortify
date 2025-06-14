# handwriting.py
from fastapi import APIRouter, HTTPException
from typing import Dict, List
from PIL import Image, ImageDraw, ImageFont
import textwrap
import uuid
import os
import random
import numpy as np

router = APIRouter(prefix="/render", tags=["Handwriting Rendering"])

# Configuration (same as before)
FONT_STYLES = {
    "QECarolineMutiboko": "QECarolineMutiboko.ttf",
    "kalam-Regular": "kalam-Regular.ttf",
    "QEDaveMergens": "QEDaveMergens.ttf",
    "QEGarrettWMoretz": "QEGarrettWMoretz.ttf",
    "QEGHHughes": "QEGHHughes.ttf",
    "QEHerbertCooper": "QEHerbertCooper.ttf",
    "QERuthStafford": "QERuthStafford.ttf",
}

FONT_SIZES = {
    "small": 20,
    "medium": 30,
    "large": 40,
    "xlarge": 50,
    "xxlarge": 60
}

INK_COLORS = {
    "black": (0, 0, 0),
    "blue": (0, 0, 200),
    "red": (200, 0, 0),
    "green": (0, 150, 0),
    "custom": None
}

def create_ruled_paper(width: int, height: int) -> Image.Image:
    """Create a ruled paper background"""
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    
    # Draw margin line
    draw.line((50, 0, 50, height), fill=(200, 200, 200), width=1)
    
    # Draw horizontal lines
    line_spacing = 30
    for y in range(50, height, line_spacing):
        draw.line((0, y, width, y), fill=(220, 220, 220), width=1)
    
    return img 

PAPER_TYPES = {
    "plain": lambda w, h: Image.new("RGB", (w, h), "white"),
    "ruled": create_ruled_paper
}

def render_text_to_pages(text: str, font, ink_color_rgb, paper_type, 
                        paper_width: int, paper_height: int, margin: int, 
                        line_spacing: float) -> List[Image.Image]:
    """Render text to multiple pages if needed"""
    pages = []
    
    # Calculate text metrics
    line_height = int(font.size * line_spacing)
    usable_height = paper_height - 2 * margin
    max_lines_per_page = usable_height // line_height
    
    # Calculate average character width for text wrapping
    avg_char_width = sum(
        (font.getbbox(char)[2] - font.getbbox(char)[0])
        for char in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    ) / 52
    max_chars = int((paper_width - 2 * margin) / avg_char_width)
    
    # Wrap text into lines
    paragraphs = text.split('\n')
    all_lines = []
    
    for paragraph in paragraphs:
        if paragraph.strip():
            wrapped_lines = textwrap.wrap(paragraph, width=max_chars)
            all_lines.extend(wrapped_lines)
        else:
            all_lines.append("")  # Empty line for paragraph breaks
    
    # Split lines into pages
    current_page_lines = []
    
    for line in all_lines:
        if len(current_page_lines) >= max_lines_per_page:
            # Create a new page
            page = render_page(current_page_lines, font, ink_color_rgb, 
                             paper_type, paper_width, paper_height, 
                             margin, line_height)
            pages.append(page)
            current_page_lines = []
        
        current_page_lines.append(line)
    
    # Add the last page if it has content
    if current_page_lines:
        page = render_page(current_page_lines, font, ink_color_rgb, 
                         paper_type, paper_width, paper_height, 
                         margin, line_height)
        pages.append(page)
    
    return pages

def render_page(lines: List[str], font, ink_color_rgb, paper_type, 
                paper_width: int, paper_height: int, margin: int, 
                line_height: int) -> Image.Image:
    """Render a single page with given lines"""
    # Create paper
    paper = PAPER_TYPES.get(paper_type, "ruled")(paper_width, paper_height)
    draw = ImageDraw.Draw(paper)
    
    # Add natural variations to handwriting
    def get_variation():
        return random.randint(-2, 2), random.randint(-2, 2)
    
    x = margin
    y = margin
    
    # Draw each line
    for line in lines:
        if not line:  # Empty line
            y += line_height
            continue
            
        # Add slight variations to each character for more natural look
        current_x = x
        for char in line:
            char_width = font.getbbox(char)[2] - font.getbbox(char)[0]
            offset_x, offset_y = get_variation()
            draw.text(
                (current_x + offset_x, y + offset_y),
                char,
                font=font,
                fill=ink_color_rgb
            )
            current_x += char_width
        
        y += line_height
    
    return paper

@router.post("/handwriting")
async def render_handwriting(request: Dict):
    try:
        text = request.get("text", "")
        if not text or text.strip() == "":
            raise HTTPException(status_code=400, detail="No text provided or text is empty")
        
        # Get configuration or use defaults
        paper_type = request.get("paper_type", "ruled")
        ink_color = request.get("ink_color", "blue")
        font_size = request.get("font_size", "medium")
        font_style = request.get("font_style", "kalam-Regular")
        line_spacing = request.get("line_spacing", 1.5)
        margin = request.get("margin", 100)
        
        # Validate and process parameters
        if ink_color == "custom":
            custom_color = request.get("custom_color", (0, 0, 200))
            if not isinstance(custom_color, (list, tuple)) or len(custom_color) != 3:
                custom_color = (0, 0, 200)
            ink_color_rgb = tuple(min(max(int(c), 0), 255) for c in custom_color)
        else:
            ink_color_rgb = INK_COLORS.get(ink_color, (0, 0, 200))
        
        font_size_px = FONT_SIZES.get(font_size, 30)
        
        # Load font
        try:
            font_filename = FONT_STYLES.get(font_style, "kalam-Regular.ttf")
            font_path = f"fonts/{font_filename}"
            font = ImageFont.truetype(font_path, font_size_px)
        except:
            # Fallback to default font
            font_path = "fonts/kalam-Regular.ttf"
            try:
                font = ImageFont.truetype(font_path, font_size_px)
            except:
                font = ImageFont.load_default()
        
        # Paper dimensions
        paper_width = 210 * 5  # A4 width in pixels at ~300 DPI
        paper_height = 297 * 5  # A4 height
        
        # Render text to multiple pages
        pages = render_text_to_pages(
            text, font, ink_color_rgb, paper_type,
            paper_width, paper_height, margin, line_spacing
        )
        
        # Save all pages and return their paths
        image_paths = []
        base_filename = str(uuid.uuid4())
        
        for i, page in enumerate(pages):
            if len(pages) == 1:
                output_path = f"outputs/{base_filename}.png"
            else:
                output_path = f"outputs/{base_filename}_page_{i+1}.png"
            
            page.save(output_path, "PNG", dpi=(300, 300))
            image_paths.append(output_path)
        
        return {
            "image_path": image_paths[0] if len(image_paths) == 1 else image_paths,
            "image_paths": image_paths,
            "total_pages": len(pages)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Rendering failed: {str(e)}")