from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from yt_dlp import YoutubeDL
from urllib.parse import urlparse, parse_qs
import whisper
import os
import tempfile

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

def get_transcript(video_id):
    try:
        # Try to get English transcript first
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try to find English transcript (manual or generated)
        try:
            transcript = transcript_list.find_manually_created_transcript(['en']).fetch()
        except NoTranscriptFound:
            try:
                transcript = transcript_list.find_generated_transcript(['en']).fetch()
            except NoTranscriptFound:
                # If English not found, try fallback to any available transcript
                fallback_languages = ['hi', 'es', 'fr', 'de']  # Add more languages as needed
                transcript = None
                
                for lang in fallback_languages:
                    try:
                        transcript = transcript_list.find_manually_created_transcript([lang]).fetch()
                        break
                    except NoTranscriptFound:
                        try:
                            transcript = transcript_list.find_generated_transcript([lang]).fetch()
                            break
                        except NoTranscriptFound:
                            continue
                
                if not transcript:
                    # Try to get any available transcript and translate to English
                    for transcript_obj in transcript_list:
                        try:
                            if transcript_obj.is_translatable:
                                transcript = transcript_obj.translate('en').fetch()
                                break
                            else:
                                transcript = transcript_obj.fetch()
                                break
                        except:
                            continue
                    
                    if not transcript:
                        raise NoTranscriptFound("No transcripts found in any language")
        
        # Combine transcript texts
        # FetchedTranscriptSnippet objects use .text attribute, not ['text'] key
        full_transcript = " ".join([t.text for t in transcript])
        return full_transcript
        
    except (TranscriptsDisabled, NoTranscriptFound) as e:
        # Handle no transcripts found or disabled
        print(f"Transcript error: {e}")
        raise e

def transcribe_audio(video_url: str) -> str:
    """Fallback transcription using Whisper when subtitles are not available"""
    try:
        print("Attempting audio transcription with Whisper...")
        
        # Create temporary directory for audio file
        with tempfile.TemporaryDirectory() as temp_dir:
            audio_path = os.path.join(temp_dir, "audio.%(ext)s")
            
            # Download audio only
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': audio_path,
                'quiet': True,
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
            
            print(f"Audio downloaded: {audio_file}")
            
            # Load Whisper model (using base model for balance of speed/accuracy)
            model = whisper.load_model("base")
            
            # Transcribe the audio
            result = model.transcribe(audio_file)
            
            print("Audio transcription completed")
            return result["text"]
            
    except Exception as e:
        print(f"Audio transcription failed: {e}")
        raise Exception(f"Could not transcribe audio: {str(e)}")

def get_transcript_and_details(video_url: str):
    video_id = extract_video_id(video_url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")
    
    transcript = None
    
    # First try to get existing subtitles
    try:
        transcript = get_transcript(video_id)
        if transcript:
            print("Used existing subtitles")
    except (TranscriptsDisabled, NoTranscriptFound, ValueError) as e:
        print(f"Subtitles not available: {e}")
        
        # Fallback to audio transcription
        try:
            transcript = transcribe_audio(video_url)
            print("Used audio transcription")
        except Exception as audio_error:
            raise ValueError(f"Neither subtitles nor audio transcription available: {str(audio_error)}")
    
    if not transcript:
        raise ValueError("No transcript could be generated")
    
    details = get_video_details(video_url)
    return transcript, details