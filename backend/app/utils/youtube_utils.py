from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from yt_dlp import YoutubeDL
from urllib.parse import urlparse, parse_qs
import faster_whisper
import os
import tempfile
import time
import logging
from xml.etree.ElementTree import ParseError
import google.generativeai as genai
import tempfile
from app.core.config import settings

def transcribe_with_gemini(video_url: str) -> str:
    """Primary transcription using Google Gemini API"""
    try:
        logger.info("Attempting transcription with Google Gemini...")
        
        # Configure Gemini API
        genai.configure(api_key=settings.GOOGLE_AI_API_KEY)  # Add this to your .env file
        
        # Create temporary directory for audio file
        with tempfile.TemporaryDirectory() as temp_dir:
            audio_path = os.path.join(temp_dir, "audio.%(ext)s")
            
            # Download audio only
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': audio_path,
                'quiet': True,
                'no_warnings': True,
            }
            
            with YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])
            
            # Find the downloaded audio file
            audio_file = None
            for file in os.listdir(temp_dir):
                if file.startswith("audio"):
                    audio_file = os.path.join(temp_dir, file)
                    break
            
            if not audio_file:
                raise Exception("Failed to download audio")
            
            logger.info(f"Audio downloaded: {audio_file}")
            
            # Upload file to Gemini
            uploaded_file = genai.upload_file(path=audio_file)
            logger.info(f"File uploaded to Gemini: {uploaded_file.uri}")
            
            # Create model and generate transcript
            model = genai.GenerativeModel(model_name="gemini-2.5-flash")
            prompt_parts = ["Transcribe this audio file accurately. Provide only the transcription text without any additional commentary.", uploaded_file]
            
            response = model.generate_content(prompt_parts)
            
            if response.text:
                logger.info("Gemini transcription completed")
                return response.text.strip()
            else:
                raise Exception("Gemini returned no transcription text")
            
    except Exception as e:
        logger.error(f"Gemini transcription failed: {e}")
        raise Exception(f"Could not transcribe with Gemini: {str(e)}")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_video_id(url: str) -> str:
    parsed_url = urlparse(url)
    if parsed_url.hostname == "youtu.be":
        return parsed_url.path[1:]
    if parsed_url.hostname in ("www.youtube.com", "youtube.com"):
        return parse_qs(parsed_url.query).get("v", [None])[0]
    return None

def get_video_details(video_url: str):
    ydl_opts = {
        'quiet': True,
        'skip_download': True,
        'extract_flat': True,
    }
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=False)
        return {
            "title": info.get("title"),
            "channelName": info.get("uploader"),
            "duration": info.get("duration"),
            "publishDate": info.get("upload_date"),
            "thumbnailUrl": info.get("thumbnail"),
        }

def get_transcript_with_retry(video_id, max_retries=3, delay=2):
    """
    Get transcript with retry logic to handle XML parsing errors
    """
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting to get transcript for {video_id}, attempt {attempt + 1}")
            
            # Get list of available transcripts
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            
            # Strategy 1: Try manually created English transcript
            try:
                transcript = transcript_list.find_manually_created_transcript(['en']).fetch()
                logger.info("Successfully retrieved manually created English transcript")
                return " ".join([t['text'] for t in transcript])
            except NoTranscriptFound:
                logger.info("No manually created English transcript found")
            
            # Strategy 2: Try auto-generated English transcript
            try:
                transcript = transcript_list.find_generated_transcript(['en']).fetch()
                logger.info("Successfully retrieved auto-generated English transcript")
                return " ".join([t['text'] for t in transcript])
            except NoTranscriptFound:
                logger.info("No auto-generated English transcript found")
            except ParseError as e:
                logger.warning(f"XML Parse error on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
                    continue
                else:
                    raise e
            
            # Strategy 3: Try other available languages and translate
            available_transcripts = list(transcript_list)
            if available_transcripts:
                for transcript_obj in available_transcripts:
                    try:
                        if transcript_obj.is_translatable:
                            logger.info(f"Trying to translate from {transcript_obj.language_code}")
                            transcript = transcript_obj.translate('en').fetch()
                            logger.info("Successfully retrieved and translated transcript")
                            return " ".join([t['text'] for t in transcript])
                        else:
                            # Use the original language transcript
                            logger.info(f"Using original language transcript: {transcript_obj.language_code}")
                            transcript = transcript_obj.fetch()
                            return " ".join([t['text'] for t in transcript])
                    except ParseError as e:
                        logger.warning(f"XML Parse error for {transcript_obj.language_code}: {e}")
                        continue
                    except Exception as e:
                        logger.warning(f"Error with {transcript_obj.language_code}: {e}")
                        continue
            
            # If we get here, no transcript worked
            raise NoTranscriptFound("No transcripts could be retrieved")
            
        except ParseError as e:
            logger.warning(f"XML Parse error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {delay} seconds...")
                time.sleep(delay)
                delay *= 1.5  # Exponential backoff
            else:
                logger.error("Max retries reached for XML parsing")
                raise e
        except (TranscriptsDisabled, NoTranscriptFound) as e:
            logger.error(f"Transcript not available: {e}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                raise e

def get_transcript(video_id):
    """
    Main transcript function with fallback strategies
    """
    try:
        return get_transcript_with_retry(video_id)
    except Exception as e:
        logger.error(f"All transcript retrieval strategies failed: {e}")
        raise e

def transcribe_audio(video_url: str) -> str:
    """Fallback transcription using Whisper when subtitles are not available"""
    try:
        logger.info("Attempting audio transcription with Whisper...")
        
        # Create temporary directory for audio file
        with tempfile.TemporaryDirectory() as temp_dir:
            audio_path = os.path.join(temp_dir, "audio.%(ext)s")
            
            # Download audio only
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': audio_path,
                'quiet': True,
                'no_warnings': True,
            }
            
            with YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])
            
            # Find the downloaded audio file
            audio_file = None
            for file in os.listdir(temp_dir):
                if file.startswith("audio"):
                    audio_file = os.path.join(temp_dir, file)
                    break
            
            if not audio_file:
                raise Exception("Failed to download audio")
            
            logger.info(f"Audio downloaded: {audio_file}")
            
            # Load Whisper model (using base model for balance of speed/accuracy)
            model = faster_whisper.WhisperModel("base")
            
            # Transcribe the audio
            segments, info = model.transcribe(audio_file)
            
            # Extract text from segments
            transcript_text = " ".join([segment.text for segment in segments])
            
            logger.info("Audio transcription completed")
            return transcript_text
            
    except Exception as e:
        logger.error(f"Audio transcription failed: {e}")
        raise Exception(f"Could not transcribe audio: {str(e)}")

def get_transcript_and_details(video_url: str):
    """
    Main function to get transcript and video details with Gemini as primary, fallbacks as secondary
    """
    video_id = extract_video_id(video_url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")
    
    transcript = None
    transcript_source = None
    
    # Strategy 1: Try Gemini API transcription first
    try:
        transcript = transcribe_with_gemini(video_url)
        if transcript:
            transcript_source = "gemini_transcription"
            logger.info("Successfully used Gemini transcription")
    except Exception as e:
        logger.warning(f"Gemini transcription failed: {e}")
        
        # Strategy 2: Fallback to existing subtitles with retry logic
        try:
            transcript = get_transcript(video_id)
            if transcript:
                transcript_source = "subtitles"
                logger.info("Successfully used existing subtitles as fallback")
        except Exception as subtitle_error:
            logger.warning(f"Subtitles not available: {subtitle_error}")
            
            # Strategy 3: Final fallback to Whisper audio transcription
            try:
                transcript = transcribe_audio(video_url)
                transcript_source = "whisper_transcription"
                logger.info("Successfully used Whisper transcription as final fallback")
            except Exception as whisper_error:
                logger.error(f"All transcription methods failed. Gemini: {str(e)}, Subtitles: {str(subtitle_error)}, Whisper: {str(whisper_error)}")
                raise ValueError(f"No transcription method available. Gemini: {str(e)}, Subtitles: {str(subtitle_error)}, Whisper: {str(whisper_error)}")
    
    if not transcript:
        raise ValueError("No transcript could be generated")
    
    # Get video details (keep existing logic)
    try:
        details = get_video_details(video_url)
        details['transcript_source'] = transcript_source
    except Exception as e:
        logger.warning(f"Could not get video details: {e}")
        details = {
            "title": "Unknown",
            "channelName": "Unknown",
            "duration": None,
            "publishDate": None,
            "thumbnailUrl": None,
            "transcript_source": transcript_source
        }
    
    return transcript, details