import logging
from pathlib import Path
from typing import List, Tuple, Dict, Any
import asyncio
from functools import lru_cache
import os
from app.core.config import settings
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

class WhisperTranscriber:
    """Optimized WhisperTranscriber with caching and performance improvements."""
    
    # Class variable for model instance - initialize once and reuse
    _model = None
    _model_lock = asyncio.Lock()
    
    @classmethod
    def get_model(cls):
        """Get or initialize the Whisper model with optimal settings."""
        if cls._model is None:
            # Use the smallest model that meets your quality needs
            model_size = getattr(settings, 'WHISPER_MODEL_SIZE', 'base')
            
            # Check for GPU availability
            compute_type = "int8"
            device = "cpu"
            
            # Try to use CUDA if available
            try:
                import torch
                if torch.cuda.is_available():
                    device = "cuda"
                    compute_type = "float16"  # Better precision on GPU
                    logger.info("CUDA available, using GPU for transcription")
            except ImportError:
                logger.warning("Torch not available, defaulting to CPU")
                
            logger.info(f"Initializing Whisper model: size={model_size}, device={device}, compute_type={compute_type}")
            cls._model = WhisperModel(model_size, device=device, compute_type=compute_type)
            
        return cls._model
    
    @staticmethod
    @lru_cache(maxsize=32)  # Cache recent transcriptions to avoid reprocessing
    def _get_cache_key(audio_path):
        """Generate a cache key based on file path and modification time."""
        try:
            mtime = os.path.getmtime(audio_path)
            return f"{audio_path}:{mtime}"
        except (OSError, TypeError):
            return str(audio_path)
    
    @classmethod
    async def transcribe_audio(cls, audio_path: Path) -> Dict[str, Any]:
        """Transcribe audio using faster-whisper with optimized settings."""
        cache_key = cls._get_cache_key(audio_path)
        
        try:
            logger.info(f"Transcribing audio with Faster-Whisper: {audio_path}")
            
            # Use a lock to prevent multiple simultaneous model loads
            async with cls._model_lock:
                model = cls.get_model()
            
            # Run transcription in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            segments_and_info = await loop.run_in_executor(
                None,
                lambda: model.transcribe(
                    str(audio_path),
                    beam_size=5,
                    vad_filter=True,  # Voice Activity Detection to skip silence
                    vad_parameters=dict(min_silence_duration_ms=500),  # Adjust as needed
                    initial_prompt="This is a transcription of a video.",  # Help orient the model
                    word_timestamps=False  # Set to True only if you need word-level timing
                )
            )
            
            segments_generator, info = segments_and_info
            
            transcript_text = ""
            segments_list = []
            
            # Process segments efficiently
            for segment in segments_generator:
                start, end, text = segment.start, segment.end, segment.text
                segments_list.append({"start": start, "end": end, "text": text})
                transcript_text += text.strip() + " "
            
            logger.info(f"Faster-Whisper transcription complete: {len(segments_list)} segments, {info.duration:.2f}s audio")
            
            return {
                "text": transcript_text.strip(),
                "segments": segments_list,
                "duration": info.duration,
                "language": info.language
            }
            
        except Exception as e:
            logger.error(f"Faster-Whisper Transcription Failed: {e}")
            return {}
    
    @classmethod
    async def transcribe_video(cls, video_path: Path) -> Dict[str, Any]:
        """Transcribe a video file by first extracting audio."""
        # Import here to avoid circular imports
        from app.utils.analyzer import VideoAnalyzer
        
        # Check if we already have a transcription cached
        video_id = video_path.stem
        cache_file = Path(getattr(settings, 'CACHE_DIR', '/tmp')) / f"{video_id}_transcript.json"
        
        # Try to load cached transcription
        try:
            if cache_file.exists():
                import json
                with open(cache_file, 'r') as f:
                    cached_data = json.load(f)
                    logger.info(f"Using cached transcription for {video_id}")
                    return cached_data
        except Exception as e:
            logger.warning(f"Failed to load cached transcription: {e}")
        
        # Extract audio and transcribe
        audio_path = await VideoAnalyzer.extract_audio(video_path)
        transcript_data = await cls.transcribe_audio(audio_path)
        
        # Cache the result for future use
        try:
            import json
            cache_file.parent.mkdir(exist_ok=True, parents=True)
            with open(cache_file, 'w') as f:
                json.dump(transcript_data, f)
        except Exception as e:
            logger.warning(f"Failed to cache transcription: {e}")
        
        return transcript_data
    
    @classmethod
    async def enhance_segments(cls, video_path: Path, segments: List[Tuple[float, float, float]]) -> List[Tuple[float, float, float]]:
        """Enhance segments using transcript data."""
        transcript_data = await cls.transcribe_video(video_path)
        transcript_segments = transcript_data.get("segments", [])
        
        # This is a simple implementation that could be expanded
        # to improve segments based on speech presence
        if not transcript_segments:
            return segments
            
        enhanced_segments = []
        
        for start, end, confidence in segments:
            # Check if there's speech in this segment
            has_speech = any(
                seg["start"] <= end and seg["end"] >= start
                for seg in transcript_segments
            )
            
            # Boost confidence for segments with speech
            if has_speech:
                enhanced_confidence = min(1.0, confidence * 1.2)
                enhanced_segments.append((start, end, enhanced_confidence))
            else:
                # Slightly reduce confidence for segments without speech
                enhanced_segments.append((start, end, confidence * 0.9))
                
        return enhanced_segments