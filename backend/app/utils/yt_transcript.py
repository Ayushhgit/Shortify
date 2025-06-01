from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound, NoTranscriptAvailable

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
    
    except (TranscriptsDisabled, NoTranscriptFound, NoTranscriptAvailable) as e:
        # Handle no transcripts found or disabled
        print(f"Transcript error: {e}")
        return None
