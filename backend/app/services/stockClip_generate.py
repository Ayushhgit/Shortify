import os
import logging
from moviepy.editor import *
from gtts import gTTS
from dotenv import load_dotenv
import google.generativeai as genai
from moviepy.config import change_settings
from app.core.config import settings
import re
import math
import time

change_settings({"IMAGEMAGICK_BINARY": "C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe"})

logger = logging.getLogger(__name__)
load_dotenv()

def generate_script(topic: str) -> str:
    """Generate a simple 45-60 second script."""
    try:
        genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        Create a 45-60 second YouTube video script about: "{topic}"
        
        Requirements:
        - 120-140 words total
        - Hook viewers in first 3 seconds
        - Conversational and engaging tone
        - Short sentences for better readability
        - No formatting, just plain text
        - End with call to action
        """
        
        response = model.generate_content(prompt)
        return response.text.strip()
        
    except Exception as e:
        logger.exception(f"Script generation failed: {e}")
        raise RuntimeError("Failed to generate script")

def generate_tts(script: str, job_id: str, temp_dir: str) -> str:
    """Generate TTS audio from script."""
    output_path = os.path.join(temp_dir, f"{job_id}.mp3")
    
    try:
        tts = gTTS(text=script, lang='en', slow=False)
        tts.save(output_path)
        logger.info("TTS audio generated successfully")
        return output_path
        
    except Exception as e:
        logger.exception(f"TTS generation failed: {e}")
        raise RuntimeError("Failed to generate TTS audio")

def generate_captions(script: str, audio_path: str) -> list:
    """Generate simple word-based captions with proper timing."""
    try:
        # Get audio duration
        with AudioFileClip(audio_path) as audio:
            audio_duration = audio.duration
        
        # Split script into words
        words = script.split()
        if not words:
            return []
        
        # Calculate timing
        words_per_second = len(words) / audio_duration
        
        # Group words into readable chunks (3-5 words each)
        captions = []
        chunk_size = 4
        current_time = 0.0
        
        for i in range(0, len(words), chunk_size):
            chunk_words = words[i:i+chunk_size]
            text = " ".join(chunk_words)
            
            # Calculate duration for this chunk
            duration = len(chunk_words) / words_per_second
            # Add small buffer for readability
            duration = max(duration * 1.2, 1.0)
            
            start_time = current_time
            end_time = min(start_time + duration, audio_duration)
            
            captions.append(((start_time, end_time), text))
            current_time = end_time
            
            if current_time >= audio_duration:
                break
        
        logger.info(f"Generated {len(captions)} caption chunks")
        return captions
        
    except Exception as e:
        logger.exception(f"Caption generation failed: {e}")
        # Fallback: split into equal time chunks
        words = script.split()
        chunk_size = 4
        duration_per_chunk = 60.0 / math.ceil(len(words) / chunk_size)  # Assume 60s default
        
        captions = []
        current_time = 0.0
        
        for i in range(0, len(words), chunk_size):
            chunk_words = words[i:i+chunk_size]
            text = " ".join(chunk_words)
            
            start_time = current_time
            end_time = start_time + duration_per_chunk
            
            captions.append(((start_time, end_time), text))
            current_time = end_time
        
        return captions

def create_subtitle_clip(text: str, duration: tuple, video_size: tuple):
    """Create a large, readable subtitle clip."""
    video_width, video_height = video_size
    
    # Much larger font size for mobile readability
    font_size = 32 
    
    # Create text clip with large, bold font
    txt_clip = TextClip(
        text.upper(),  # Uppercase for better readability
        fontsize=font_size,
        font='Arial-Bold',
        color='white',
        stroke_color='white',
        stroke_width=0.4,  # Thick outline for contrast
        method='caption'
    )
    
    # Position at bottom of screen with padding
    bottom_margin = video_height * 0.15  # 15% from bottom
    txt_clip = txt_clip.set_position(('center', video_height - bottom_margin - txt_clip.h))
    
    # Set timing
    start_time, end_time = duration
    txt_clip = txt_clip.set_start(start_time).set_duration(end_time - start_time)
    
    return txt_clip

def combine_video_audio_captions(stock_video_path: str, audio_path: str, captions: list, output_path: str):
    """Combine video, audio, and captions into final video."""
    video_clip = None
    audio_clip = None
    final_video = None
    
    try:
        # Load video and audio
        video_clip = VideoFileClip(stock_video_path)
        audio_clip = AudioFileClip(audio_path)
        
        # Match video duration to audio
        if video_clip.duration > audio_clip.duration:
            video_clip = video_clip.subclip(0, audio_clip.duration)
        elif video_clip.duration < audio_clip.duration:
            video_clip = video_clip.loop(duration=audio_clip.duration)
        
        # Remove original audio and add new audio
        video_clip = video_clip.set_audio(audio_clip)
        
        # Create subtitle clips
        subtitle_clips = []
        for duration, text in captions:
            subtitle = create_subtitle_clip(
                text=text,
                duration=duration,
                video_size=(video_clip.w, video_clip.h)
            )
            subtitle_clips.append(subtitle)
        
        # Combine video with subtitles
        final_video = CompositeVideoClip([video_clip] + subtitle_clips)
        
        # Export with good quality settings
        final_video.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac',
            fps=30,
            bitrate='2000k',
            verbose=False,
            logger=None
        )
        
        logger.info(f"Video created successfully: {output_path}")
        
    except Exception as e:
        logger.exception(f"Video combination failed: {e}")
        raise RuntimeError("Failed to create final video")
    
    finally:
        # Clean up resources
        for clip in [video_clip, audio_clip, final_video]:
            if clip:
                try:
                    clip.close()
                except:
                    pass
        
        # Clean up temporary audio file
        try:
            if os.path.exists(audio_path):
                time.sleep(0.5)  # Wait for file to be released
                os.remove(audio_path)
        except Exception as e:
            logger.warning(f"Could not remove temp audio: {e}")

# Simplified functions for main router
generate_enhanced_tts = generate_tts
generate_precise_captions_with_gemini = generate_captions
combine_video_audio_captions_enhanced = combine_video_audio_captions