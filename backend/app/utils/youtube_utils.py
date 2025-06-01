from youtube_transcript_api import TranscriptsDisabled
from yt_dlp import YoutubeDL
from urllib.parse import urlparse, parse_qs

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

from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

def get_transcript(video_id):
    try:
        # Try to get English transcript first
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try to find English transcript (manual or generated)
        if transcript_list.find_manually_created_transcript(['en']):
            transcript = transcript_list.find_manually_created_transcript(['en']).fetch()
        elif transcript_list.find_generated_transcript(['en']):
            transcript = transcript_list.find_generated_transcript(['en']).fetch()
        else:
            # If English not found, try fallback to any available transcript (like Hindi 'hi')
            fallback_languages = ['hi']  # you can add more languages if you want
            
            for lang in fallback_languages:
                try:
                    if transcript_list.find_manually_created_transcript([lang]):
                        transcript = transcript_list.find_manually_created_transcript([lang]).fetch()
                        break
                    elif transcript_list.find_generated_transcript([lang]):
                        transcript = transcript_list.find_generated_transcript([lang]).fetch()
                        break
                except NoTranscriptFound:
                    continue
            else:
                # No transcript found in fallback languages either
                raise NoTranscriptFound(f"No transcripts found in fallback languages: {fallback_languages}")
        
        # Combine transcript texts
        full_transcript = " ".join([t['text'] for t in transcript])
        return full_transcript
    
    except (TranscriptsDisabled, NoTranscriptFound,) as e:
        # Handle no transcripts found or disabled
        print(f"Transcript error: {e}")
        return None


def get_transcript_and_details(video_url: str):
    video_id = extract_video_id(video_url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")

    try:
        transcript_data = get_transcript(video_id)
        transcript = " ".join([entry["text"] for entry in transcript_data])
    except TranscriptsDisabled:
        raise ValueError("Transcript is disabled for this video")

    details = get_video_details(video_url)
    return transcript, details
