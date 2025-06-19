import os
import logging
from moviepy.editor import *
from moviepy.video.tools.subtitles import SubtitlesClip
from groq import Groq
from gtts import gTTS
from dotenv import load_dotenv
import os
import logging
from moviepy.config import change_settings

change_settings({"IMAGEMAGICK_BINARY": "C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe"})


logger = logging.getLogger(__name__)

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

try:
    if GROQ_API_KEY == "YOUR_GROQ_API_KEY":
        logger.warning("Groq API key is set to the default placeholder. The script generation will fail.")
        client = None
    else:
        client = Groq(api_key=GROQ_API_KEY)
except Exception as e:
    logger.exception(f"Failed to initialize Groq client: {e}")
    client = None

def generate_script(topic: str) -> str :
    """
    Generates a 45-60 second voiceover script for a given topic using the Groq API.
    """
    if not client:
        raise RuntimeError("Groq client not initialized. Please set the GROQ_API_KEY.")
    
    prompt = f"""
    You are a scriptwriter for a short, engaging YouTube video aimed at a general audience.
    Your task is to write a voiceover script for the topic: "{topic}".
    The script must be between 130 and 160 words long, which translates to a voiceover of roughly 45-60 seconds.
    The tone should be conversational, clear, and exciting.
    Do not include any titles, speaker names (like "Narrator:"), or scene directions (like "[SCENE START]").
    Your output should only be the raw text of the script itself.
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful YouTube scriptwriter."},
                {"role": "user", "content": prompt}
            ],
            model="llama3-8b-8192",
            temperature=0.7,
            max_tokens=250,
        )
        script = chat_completion.choices[0].message.content
        return script.strip()
    except Exception as e:
        logger.exception(f"An error occurred while calling the Groq API: {e}")
        raise RuntimeError("Failed to generate script from Groq.")
    
def generate_tts(script: str, job_id: str, temp_dir: str) -> str:
    """
    Generates TTS audio from the script using gTTS and saves it to a temporary file.
    """
    output_path = os.path.join(temp_dir, f"{job_id}.mp3")

    try:
        tts = gTTS(text=script, lang='en', slow=False)
        tts.save(output_path)
        logger.info("TTS audio generated successfully with gTTS.")
        return output_path
    except Exception as e:
        logger.exception(f"An error occurred during gTTS generation: {e}")
        raise RuntimeError("Could not generate TTS audio.")
    
def generate_captions_from_script(script: str, audio_path: str) -> list:
    """
    Generates caption data from the original script text by estimating word timing.
    """
    try:
        with AudioFileClip(audio_path) as audio_clip:
            audio_duration = audio_clip.duration
        
        words = script.split()
        num_words = len(words)
        
        if num_words == 0:
            return []
            
        duration_per_word = audio_duration / num_words
        
        captions = []
        current_time = 0.0
        
        chunk_size = 5 # Number of words per caption line for better readability
        for i in range(0, num_words, chunk_size):
            chunk = words[i:i+chunk_size]
            text = " ".join(chunk)
            
            start_time = current_time
            end_time = start_time + (len(chunk) * duration_per_word)
            
            if end_time > audio_duration:
                end_time = audio_duration
                
            captions.append(((start_time, end_time), text))
            current_time = end_time
            if current_time >= audio_duration:
                break
        
        return captions
    except Exception as e:
        logger.exception(f"Failed to generate captions: {e}")
        return []
    
def combine_video_audio_captions(stock_video_path: str, audio_path: str, captions: list, output_path: str, temp_dir: str):
    """
    Combines the stock video, generated audio, and captions into a final MP4 file using MoviePy.
    """
    video_clip = None
    audio_clip = None
    result = None
    try:
        # --- Load Video and Audio ---
        video_clip = VideoFileClip(stock_video_path, audio=False)
        audio_clip = AudioFileClip(audio_path)
        
        # --- Trim video to match the exact audio length ---
        if video_clip.duration > audio_clip.duration:
            video_clip = video_clip.subclip(0, audio_clip.duration)
        
        # --- Set the generated audio on the video clip ---
        final_clip = video_clip.set_audio(audio_clip)

        # --- Create and Style Subtitles Clip ---
        def subtitle_generator(txt):
            return TextClip(
                txt,
                font='Arial-Bold', # Ensure this font is available on your system
                fontsize=32,
                color='white',
                stroke_color='black',
                stroke_width=2,
                method='caption', # Wraps text automatically
                size=(final_clip.w * 0.9, None) # Captions take up 90% of video width
            )

        subtitles = SubtitlesClip(captions, subtitle_generator)
        
        # --- Overlay Subtitles on the Video ---
        # Position the subtitles at the bottom center with a small margin
        result = CompositeVideoClip([
            final_clip,
            subtitles.set_position(('center', 'bottom')).margin(bottom=30, opacity=0) # opacity=0 for margin
        ])

        # --- Write the Final Video to a File ---
        temp_audio_path = os.path.join(temp_dir, 'temp-audio.m4a')
        result.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac',
            temp_audiofile=temp_audio_path,
            remove_temp=True,
            fps=24 # A standard frame rate
        )
    
    except Exception as e:
        logger.exception(f"Error combining media: {e}")
        raise RuntimeError("Failed to create the final video.")
    finally:
        # --- Cleanup: Close all clips to release file locks ---
        if video_clip: video_clip.close()
        if audio_clip: audio_clip.close()
        if result: result.close()
        # Clean up the generated audio file
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
                logger.info(f"Cleaned up temp audio file: {audio_path}")
            except Exception as e:
                logger.error(f"Failed to remove temp audio file {audio_path}: {e}")




