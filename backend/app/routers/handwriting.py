# handwriting.py
from fastapi import APIRouter, HTTPException
from typing import Dict
from PIL import Image, ImageDraw, ImageFont
import textwrap
import uuid
import os
import random
import numpy as np

router = APIRouter(prefix="/render", tags=["Handwriting Rendering"])

# Configuration
FONT_SIZES = {
    "small": 20,
    "medium": 30,
    "large": 40,
    "xlarge": 50,
    "xxlarge": 60
}

PAPER_TYPES = {
    "plain": lambda w, h: Image.new("RGB", (w, h), "white"),
    "ruled": create_ruled_paper
}

INK_COLORS = {
    "black": (0, 0, 0),
    "blue": (0, 0, 200),
    "red": (200, 0, 0),
    "green": (0, 150, 0),
    "custom": None  # Will be set by user
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

@router.post("/handwriting")
async def render_handwriting(request: Dict):
    try:
        text = request.get("text", "")
        if not text:
            raise ValueError("No text provided")
        
        # Get configuration or use defaults
        paper_type = request.get("paper_type", "ruled")
        ink_color = request.get("ink_color", "blue")
        font_size = request.get("font_size", "medium")
        font_style = request.get("font_style", "kalam")
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
            font_path = f"fonts/{font_style}.ttf"
            font = ImageFont.truetype(font_path, font_size_px)
        except:
            # Fallback to default font
            font_path = "fonts/kalam.ttf"
            font = ImageFont.truetype(font_path, font_size_px)
        
        # Create paper
        paper_width = 210 * 5  # A4 width in pixels at ~300 DPI
        paper_height = 297 * 5  # A4 height
        paper = PAPER_TYPES.get(paper_type, "ruled")(paper_width, paper_height)
        
        # Prepare to draw text
        draw = ImageDraw.Draw(paper)
        x = margin
        y = margin
        line_height = int(font_size_px * line_spacing)
        
        # Add natural variations to handwriting
        def get_variation():
            return random.randint(-2, 2), random.randint(-2, 2)
        
        # Wrap text
        avg_char_width = sum(font.getsize(char)[0] for char in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") / 52
        max_chars = int((paper_width - 2 * margin) / avg_char_width)
        wrapped_text = textwrap.wrap(text, width=max_chars)
        
        # Draw each line
        for line in wrapped_text:
            # Add slight variations to each character for more natural look
            current_x = x
            for char in line:
                char_width = font.getsize(char)[0]
                offset_x, offset_y = get_variation()
                draw.text(
                    (current_x + offset_x, y + offset_y),
                    char,
                    font=font,
                    fill=ink_color_rgb
                )
                current_x += char_width
            
            y += line_height
            if y > paper_height - margin:
                # Handle multi-page documents (would need to extend this)
                break
        
        # Save the image
        output_path = f"outputs/{uuid.uuid4()}.png"
        paper.save(output_path, "PNG", dpi=(300, 300))
        
        return {"image_path": output_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rendering failed: {str(e)}")