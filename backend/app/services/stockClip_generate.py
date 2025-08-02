# services/stockClip_generate.py
import os
import logging
import asyncio
import tempfile
from pathlib import Path
from typing import List, Tuple, Optional
from contextlib import asynccontextmanager
import re
import json
import wave

from moviepy.editor import VideoFileClip, AudioFileClip, TextClip, CompositeVideoClip
from dotenv import load_dotenv
from google import genai
from google.genai import types
from moviepy.config import change_settings
from app.core.config import settings
from pydantic import BaseModel

# Configure ImageMagick path
change_settings({"IMAGEMAGICK_BINARY": "/usr/bin/convert"})

logger = logging.getLogger(__name__)
load_dotenv()

# Data models for type safety
class CaptionChunk(BaseModel):
    start_time: float
    end_time: float
    text: str

class VideoGenerationResult(BaseModel):
    success: bool
    output_path: Optional[str] = None
    error_message: Optional[str] = None
    script_length: Optional[int] = None
    caption_count: Optional[int] = None

class VideoProcessor:
    """Handles video processing operations with proper resource management."""
    
    def __init__(self):
        self.temp_files = []
    
    async def cleanup_temp_files(self):
        """Clean up temporary files created during processing."""
        for file_path in self.temp_files:
            try:
                if os.path.exists(file_path):
                    await asyncio.get_event_loop().run_in_executor(None, os.remove, file_path)
                    logger.debug(f"Cleaned up temp file: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up temp file {file_path}: {e}")
        self.temp_files.clear()

    def add_temp_file(self, file_path: str):
        """Register a temporary file for cleanup."""
        self.temp_files.append(file_path)

async def generate_script(topic: str) -> str:
    """Generate a simple 45-60 second script asynchronously."""
    if not topic or not topic.strip():
        raise ValueError("Topic cannot be empty")
    
    try:

        client = genai.Client(api_key=settings.GOOGLE_AI_API_KEY)
        
        prompt = f"""
        Create a 45-60 second YouTube video script about: "{topic}"
        
        Requirements:
        - 120-140 words total
        - Hook viewers in first 3 seconds with an intriguing question or statement
        - Conversational and engaging tone suitable for social media
        - Short, punchy sentences for better pacing
        - Include 2-3 interesting facts or insights
        - No formatting or special characters, just plain text
        - End with a strong call to action that encourages engagement
        - Make it educational but entertaining
        """
        
        # Run the API call in a thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, 
            lambda: client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
        )
        
        script = response.text.strip()
        
        # Validate script length
        word_count = len(script.split())
        if word_count < 100 or word_count > 160:
            logger.warning(f"Generated script has {word_count} words, outside target range")
        
        return script
        
    except Exception as e:
        logger.exception(f"Script generation failed for topic '{topic}': {e}")
        raise RuntimeError(f"Failed to generate script: {str(e)}")

async def generate_tts(script: str, job_id: str, temp_dir: str) -> str:
    """Generate high-quality TTS audio using Google Gemini API."""
    if not script or not script.strip():
        raise ValueError("Script cannot be empty")
    
    logger.info(f"[{job_id}] Generating high-quality TTS audio using Gemini...")
    output_path = os.path.join(temp_dir, f"{job_id}_audio.wav")
    
    try:
        # Run TTS generation in thread pool
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _generate_tts_sync, script, output_path)
        
        if not os.path.exists(output_path):
            raise RuntimeError("TTS file was not created")
        
        # Verify file size
        file_size = os.path.getsize(output_path)
        if file_size < 1000:  # Less than 1KB likely indicates an error
            raise RuntimeError("Generated TTS file is too small, likely corrupted")
        
        logger.info(f"[{job_id}] TTS audio successfully saved to {output_path} ({file_size} bytes)")
        return output_path
    
    except Exception as e:
        logger.exception(f"[{job_id}] Fatal error during Gemini TTS generation: {e}")
        # Clean up failed file
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except:
                pass
        raise RuntimeError(f"Failed to generate TTS audio: {str(e)}")

def _generate_tts_sync(script: str, output_path: str):
    """Synchronous TTS generation for thread pool execution using Gemini API."""
    
    # Configure the API key
    client = genai.Client(api_key=os.getenv("GOOGLE_AI_API_KEY"))
    
    try:
        # Generate content with TTS configuration
        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=script,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                 voice_name='Kore',
                                )
                            )
                        ),
                    )
                )
        
        
        # Check if response has audio data
        if not response.candidates or not response.candidates[0].content.parts:
            raise RuntimeError("No audio data received from Gemini API")
        
        # Extract audio data
        audio_part = None
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                audio_part = part
                break
        
        if not audio_part or not audio_part.inline_data.data:
            raise RuntimeError("No audio data found in response")
        
        audio_data = audio_part.inline_data.data
        
        # Save as wave file
        _save_wave_file(output_path, audio_data)
        
    except Exception as e:
        logger.error(f"TTS generation error: {str(e)}")
        raise RuntimeError(f"Failed to generate TTS: {str(e)}")


def _save_wave_file(filename: str, audio_data, channels: int = 1, rate: int = 24000, sample_width: int = 2):
    """Save audio data as a wave file."""
    try:
        # If audio_data is base64 encoded, decode it first
        if isinstance(audio_data, str):
            import base64
            audio_data = base64.b64decode(audio_data)
        
        with wave.open(filename, "wb") as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(sample_width)
            wf.setframerate(rate)
            wf.writeframes(audio_data)
            
    except Exception as e:
        logger.error(f"Error saving wave file: {str(e)}")
        raise RuntimeError(f"Failed to save audio file: {str(e)}")

async def generate_precise_captions(script: str, audio_path: str, job_id: str) -> List[CaptionChunk]:
    """Generate precise captions with word-level timestamps using Gemini."""
    logger.info(f"[{job_id}] Generating precise captions with Gemini...")
    
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    try:
        client = genai.Client(api_key=settings.GOOGLE_AI_API_KEY)
        # Upload audio file
        logger.info(f"[{job_id}] Uploading audio file for analysis...")
        loop = asyncio.get_event_loop()
        audio_file = await loop.run_in_executor(
            None,
            lambda: client.files.upload(
                file=audio_path
            )
        )
        
        logger.info(f"[{job_id}] Audio file uploaded successfully. URI: {audio_file.uri}")
        
        prompt = f"""
        You are an expert video captioner. Analyze the provided audio file and generate precise, timed captions.
        
        Instructions:
        1. Listen to the audio carefully and transcribe exactly what is spoken
        2. Group words into readable chunks of 3-6 words each
        3. Ensure timing is accurate - each chunk should start and end precisely with the spoken words
        4. Format output as valid JSON array only, no additional text
        5. Each object needs: "start_time", "end_time", "text"
        6. Times should be in seconds with decimal precision
        
        Reference script (the actual audio may vary slightly):
        ---
        {script}
        ---
        
        Return only the JSON array, no other text:
        """

        logger.info(f"[{job_id}] Sending request to Gemini for caption generation...")
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model="gemini-2.5-flash", contents=[prompt, audio_file]
            )
        )
        
        # Clean and parse response
        cleaned_response = re.sub(r'```json\n?|\n?```', '', response.text.strip())
        
        try:
            captions_data = json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            logger.error(f"[{job_id}] Failed to parse JSON response: {cleaned_response[:200]}...")
            raise RuntimeError(f"Invalid JSON response from Gemini: {str(e)}")
        
        # Validate and convert to CaptionChunk objects
        captions = []
        for i, item in enumerate(captions_data):
            try:
                chunk = CaptionChunk(**item)
                captions.append(chunk)
            except Exception as e:
                logger.warning(f"[{job_id}] Skipping invalid caption chunk {i}: {e}")
        
        if not captions:
            raise RuntimeError("No valid captions generated")
        
        logger.info(f"[{job_id}] Successfully generated {len(captions)} caption chunks.")
        
        # Clean up uploaded file
        try:
            await loop.run_in_executor(None, lambda: genai.delete_file(audio_file.name))
            logger.info(f"[{job_id}] Deleted temporary file from Google AI")
        except Exception as e:
            logger.warning(f"[{job_id}] Failed to delete temporary file: {e}")
        
        return captions

    except Exception as e:
        logger.exception(f"[{job_id}] Fatal error during caption generation: {e}")
        raise RuntimeError(f"Failed to generate precise captions: {str(e)}")

def create_subtitle_clip(text: str, start_time: float, end_time: float, video_size: Tuple[int, int]) -> TextClip:
    """Create a large, readable subtitle clip with improved styling."""
    video_width, video_height = video_size
    
    # Responsive font size based on video dimensions
    base_font_size = min(video_width, video_height) // 25
    font_size = max(22, min(34, base_font_size))  # Clamp between 28-40
    
    try:
        # Create text clip with improved styling
        txt_clip = TextClip(
            text.upper(),
            fontsize=font_size,
            font='Impact',
            color='white',
            method='caption',
            size=(video_width * 0.9, None),  # 90% of video width
        )
        
        # Position at bottom with responsive margin
        bottom_margin = video_height * 0.12
        y_position = video_height - bottom_margin - txt_clip.h
        
        txt_clip = txt_clip.set_position(('center', y_position))
        txt_clip = txt_clip.set_start(start_time).set_duration(end_time - start_time)
        
        return txt_clip
        
    except Exception as e:
        logger.error(f"Failed to create subtitle clip for text '{text}': {e}")
        # Return a fallback clip
        fallback_clip = TextClip(
            text.upper(),
            fontsize=28,
            font='Arial',
            color='white'
        ).set_position(('center', 'bottom')).set_start(start_time).set_duration(end_time - start_time)
        return fallback_clip

async def combine_video_audio_captions(
    stock_video_path: str, 
    audio_path: str, 
    captions: List[CaptionChunk], 
    output_path: str,
    job_id: str
) -> None:
    """Combine video, audio, and captions into final video with proper resource management."""
    logger.info(f"[{job_id}] Starting video composition...")
    
    # Validate input files
    if not os.path.exists(stock_video_path):
        raise FileNotFoundError(f"Stock video not found: {stock_video_path}")
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    video_clip = None
    audio_clip = None
    final_video = None
    subtitle_clips = []
    
    try:
        # Run video processing in thread pool
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            _combine_video_sync,
            stock_video_path,
            audio_path,
            captions,
            output_path,
            job_id
        )
        
        # Verify output file
        if not os.path.exists(output_path):
            raise RuntimeError("Output video file was not created")
            
        file_size = os.path.getsize(output_path)
        logger.info(f"[{job_id}] Video created successfully: {output_path} ({file_size} bytes)")
        
    except Exception as e:
        logger.exception(f"[{job_id}] Video combination failed: {e}")
        # Clean up failed output
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except:
                pass
        raise RuntimeError(f"Failed to create final video: {str(e)}")

def _combine_video_sync(
    stock_video_path: str,
    audio_path: str,
    captions: List[CaptionChunk],
    output_path: str,
    job_id: str
):
    """Synchronous video combination for thread pool execution."""
    video_clip = None
    audio_clip = None
    final_video = None
    subtitle_clips = []
    
    try:
        # Load video and audio
        video_clip = VideoFileClip(stock_video_path)
        audio_clip = AudioFileClip(audio_path)
        
        logger.info(f"[{job_id}] Video duration: {video_clip.duration}s, Audio duration: {audio_clip.duration}s")
        
        # Match video duration to audio
        if video_clip.duration > audio_clip.duration:
            video_clip = video_clip.subclip(0, audio_clip.duration)
        elif video_clip.duration < audio_clip.duration:
            # Loop video to match audio duration
            loops_needed = int(audio_clip.duration / video_clip.duration) + 1
            video_clip = video_clip.loop(duration=audio_clip.duration)
        
        # Replace audio track
        video_clip = video_clip.set_audio(audio_clip)
        
        # Create subtitle clips
        for caption in captions:
            try:
                subtitle = create_subtitle_clip(
                    text=caption.text,
                    start_time=caption.start_time,
                    end_time=caption.end_time,
                    video_size=(video_clip.w, video_clip.h)
                )
                subtitle_clips.append(subtitle)
            except Exception as e:
                logger.warning(f"[{job_id}] Failed to create subtitle for '{caption.text}': {e}")
        
        logger.info(f"[{job_id}] Created {len(subtitle_clips)} subtitle clips")
        
        # Combine video with subtitles
        final_video = CompositeVideoClip([video_clip] + subtitle_clips)
        
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Export with optimized settings
        final_video.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac',
            fps=30,
            bitrate='2500k',
            preset='medium',
            verbose=False,
            logger=None,
            temp_audiofile=f"{output_path}_temp_audio.m4a",
            remove_temp=True
        )
        
    finally:
        # Clean up resources
        for clip in [video_clip, audio_clip, final_video] + subtitle_clips:
            if clip:
                try:
                    clip.close()
                except:
                    pass

# Main API function
async def generate_video_async(
    topic: str,
    job_id: str,
    stock_video_path: str,
    output_path: str,
    temp_dir: str
) -> VideoGenerationResult:
    """Complete video generation pipeline with proper error handling and resource management."""
    processor = VideoProcessor()
    
    try:
        logger.info(f"[{job_id}] Starting video generation for topic: '{topic}'")
        
        # Step 1: Generate script
        logger.info(f"[{job_id}] Step 1: Generating script...")
        script = await generate_script(topic)
        script_length = len(script.split())
        logger.info(f"[{job_id}] Script generated ({script_length} words)")
        
        # Step 2: Generate audio
        logger.info(f"[{job_id}] Step 2: Generating audio...")
        audio_path = await generate_tts(script, job_id, temp_dir)
        processor.add_temp_file(audio_path)
        
        # Step 3: Generate captions
        logger.info(f"[{job_id}] Step 3: Generating captions...")
        captions = await generate_precise_captions(script, audio_path, job_id)
        caption_count = len(captions)
        
        # Step 4: Combine everything
        logger.info(f"[{job_id}] Step 4: Creating final video...")
        await combine_video_audio_captions(
            stock_video_path=stock_video_path,
            audio_path=audio_path,
            captions=captions,
            output_path=output_path,
            job_id=job_id
        )
        
        logger.info(f"[{job_id}] Video generation completed successfully")
        
        return VideoGenerationResult(
            success=True,
            output_path=output_path,
            script_length=script_length,
            caption_count=caption_count
        )
        
    except Exception as e:
        logger.exception(f"[{job_id}] Video generation failed: {e}")
        return VideoGenerationResult(
            success=False,
            error_message=str(e)
        )
    
    finally:
        # Clean up temporary files
        await processor.cleanup_temp_files()