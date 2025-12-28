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
from app.core.config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- ANTI-BOT CONFIGURATION ---
# This configuration mimics an Android device to bypass bot detection
ANDROID_USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'

COMMON_YDL_OPTS = {
    'quiet': True,
    'no_warnings': True,
    'extractor_args': {
        'youtube': {
            'player_client': ['android', 'web'],
            'player_skip': ['webpage', 'config'],
        }
    },
    'http_headers': {
        'User-Agent': ANDROID_USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
    },
    'cookiefile': 'cookies.txt',  # Will look for cookies.txt in the backend root
}
# ------------------------------

def transcribe_with_gemini(video_url: str) -> str:
    """Primary transcription using Google Gemini API with file state checking"""
    try:
        logger.info("Attempting transcription with Google Gemini...")
        
        # Configure Gemini API
        genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
        
        # Create temporary directory for audio file
        with tempfile.TemporaryDirectory() as temp_dir:
            audio_path = os.path.join(temp_dir, "audio.%(ext)s")
            
            # [UPDATED] Applied COMMON_YDL_OPTS here
            ydl_opts = {
                **COMMON_YDL_OPTS,
                'format': 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio/best',
                'outtmpl': audio_path,
                'extract_flat': False,
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
            
            # Wait for file to become ACTIVE
            max_wait_time = 60  # seconds
            wait_interval = 2   # seconds
            waited_time = 0
            
            while uploaded_file.state.name != "ACTIVE" and waited_time < max_wait_time:
                logger.info(f"File state: {uploaded_file.state.name}, waiting...")
                time.sleep(wait_interval)
                waited_time += wait_interval
                uploaded_file = genai.get_file(uploaded_file.name)
            
            if uploaded_file.state.name != "ACTIVE":
                raise Exception(f"File failed to become ACTIVE after {max_wait_time} seconds. State: {uploaded_file.state.name}")
            
            logger.info("File is now ACTIVE, proceeding with transcription")
            
            # Create model and generate transcript
            model = genai.GenerativeModel(model_name="gemini-2.5-flash")
            prompt_parts = [
                "Transcribe this audio file accurately. Provide only the transcription text without any additional commentary or formatting. Focus on accuracy and completeness.",
                uploaded_file
            ]
            
            response = model.generate_content(prompt_parts)
            
            # Clean up the uploaded file
            try:
                genai.delete_file(uploaded_file.name)
                logger.info("Uploaded file cleaned up")
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup uploaded file: {cleanup_error}")
            
            if response.text:
                logger.info("Gemini transcription completed successfully")
                return response.text.strip()
            else:
                raise Exception("Gemini returned no transcription text")
            
    except Exception as e:
        logger.error(f"Gemini transcription failed: {e}")
        raise Exception(f"Could not transcribe with Gemini: {str(e)}")

def extract_video_id(url: str) -> str:
    """Extract video ID from YouTube URL"""
    parsed_url = urlparse(url)
    if parsed_url.hostname == "youtu.be":
        return parsed_url.path[1:]
    if parsed_url.hostname in ("www.youtube.com", "youtube.com"):
        return parse_qs(parsed_url.query).get("v", [None])[0]
    return None

def get_video_details(video_url: str):
    """Get video metadata"""
    # [UPDATED] Applied COMMON_YDL_OPTS here and set extract_flat to True
    ydl_opts = {
        **COMMON_YDL_OPTS,
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
    """Get transcript with retry logic and robust error handling"""
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting to get transcript for {video_id}, attempt {attempt + 1}")
            
            # Get list of available transcripts
            try:
                transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            except Exception as e:
                logger.warning(f"Could not list transcripts: {e}")
                raise NoTranscriptFound(
                    video_id=video_id,
                    requested_language_codes=['en'],
                    transcript_data={}
                )
            
            # Strategy 1: Try manually created English transcript
            try:
                transcript = transcript_list.find_manually_created_transcript(['en']).fetch()
                logger.info("Successfully retrieved manually created English transcript")
                return " ".join([t['text'] for t in transcript])
            except NoTranscriptFound:
                logger.info("No manually created English transcript found")
            except Exception as e:
                logger.warning(f"Error getting manual English transcript: {e}")
            
            # Strategy 2: Try auto-generated English transcript
            try:
                transcript = transcript_list.find_generated_transcript(['en']).fetch()
                logger.info("Successfully retrieved auto-generated English transcript")
                return " ".join([t['text'] for t in transcript])
            except NoTranscriptFound:
                logger.info("No auto-generated English transcript found")
            except ParseError as e:
                logger.warning(f"XML Parse error for auto-generated transcript: {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
                    continue
                else:
                    raise e
            except Exception as e:
                logger.warning(f"Error getting auto-generated English transcript: {e}")
            
            # Strategy 3: Try other available languages and translate
            try:
                available_transcripts = list(transcript_list)
                if available_transcripts:
                    for transcript_obj in available_transcripts:
                        try:
                            logger.info(f"Trying transcript in {transcript_obj.language_code}")
                            
                            # Try to fetch the transcript
                            transcript_data = transcript_obj.fetch()
                            
                            # If we can translate it, do so
                            if transcript_obj.is_translatable and transcript_obj.language_code != 'en':
                                logger.info(f"Translating from {transcript_obj.language_code} to English")
                                transcript_data = transcript_obj.translate('en').fetch()
                            
                            # Extract text
                            transcript_text = " ".join([t['text'] for t in transcript_data])
                            if transcript_text.strip():
                                logger.info(f"Successfully retrieved transcript in {transcript_obj.language_code}")
                                return transcript_text
                            
                        except ParseError as e:
                            logger.warning(f"XML Parse error for {transcript_obj.language_code}: {e}")
                            continue
                        except Exception as e:
                            logger.warning(f"Error with {transcript_obj.language_code}: {e}")
                            continue
                else:
                    logger.info("No transcripts available for this video")
            except Exception as e:
                logger.warning(f"Error processing available transcripts: {e}")
            
            # If we get here, no transcript worked
            logger.info("No usable transcripts found")
            raise NoTranscriptFound(
                video_id=video_id,
                requested_language_codes=['en'],
                transcript_data={}
            )
            
        except ParseError as e:
            logger.warning(f"XML Parse error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {delay} seconds...")
                time.sleep(delay)
                delay *= 1.5  # Exponential backoff
            else:
                logger.error("Max retries reached for XML parsing")
                raise NoTranscriptFound(
                    video_id=video_id,
                    requested_language_codes=['en'],
                    transcript_data={}
                )
        except (TranscriptsDisabled, NoTranscriptFound) as e:
            logger.info(f"Transcripts not available for video {video_id}: {e}")
            raise e
        except Exception as e:
            logger.warning(f"Unexpected error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                logger.error(f"Max retries reached for unexpected error: {e}")
                raise NoTranscriptFound(
                    video_id=video_id,
                    requested_language_codes=['en'],
                    transcript_data={}
                )

def get_transcript(video_id):
    """Main transcript function with fallback strategies"""
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
            
            # [UPDATED] Applied COMMON_YDL_OPTS here
            ydl_opts = {
                **COMMON_YDL_OPTS,
                'format': 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio/best',
                'outtmpl': audio_path,
                'extract_flat': False,
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
            # Use CPU if GPU causes issues
            model = faster_whisper.WhisperModel("base", device="cpu", compute_type="int8")
            
            # Transcribe the audio
            segments, info = model.transcribe(audio_file, language="en")
            
            # Extract text from segments
            transcript_text = " ".join([segment.text for segment in segments])
            
            logger.info(f"Audio transcription completed. Detected language: {info.language}")
            return transcript_text
            
    except Exception as e:
        logger.error(f"Audio transcription failed: {e}")
        raise Exception(f"Could not transcribe audio: {str(e)}")

def get_transcript_and_details(video_url: str):
    """
    Main function to get transcript and video details with multiple fallback strategies
    """
    video_id = extract_video_id(video_url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")
    
    transcript = None
    transcript_source = None
    
    # Strategy 1: Try existing subtitles first (faster)
    try:
        transcript = get_transcript(video_id)
        if transcript:
            transcript_source = "subtitles"
            logger.info("Successfully used existing subtitles")
    except Exception as subtitle_error:
        logger.warning(f"Subtitles not available: {subtitle_error}")
        
        # Strategy 2: Try Gemini API transcription
        try:
            transcript = transcribe_with_gemini(video_url)
            if transcript:
                transcript_source = "gemini_transcription"
                logger.info("Successfully used Gemini transcription")
        except Exception as gemini_error:
            logger.warning(f"Gemini transcription failed: {gemini_error}")
            
            # Strategy 3: Final fallback to Whisper audio transcription
            try:
                transcript = transcribe_audio(video_url)
                transcript_source = "whisper_transcription"
                logger.info("Successfully used Whisper transcription as final fallback")
            except Exception as whisper_error:
                logger.error(f"All transcription methods failed. Subtitles: {str(subtitle_error)}, Gemini: {str(gemini_error)}, Whisper: {str(whisper_error)}")
                raise ValueError(f"No transcription method available. Subtitles: {str(subtitle_error)}, Gemini: {str(gemini_error)}, Whisper: {str(whisper_error)}")
    
    if not transcript:
        raise ValueError("No transcript could be generated")
    
    # Get video details
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