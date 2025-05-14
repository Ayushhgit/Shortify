import os
import numpy as np
import librosa
import logging
from typing import List, Tuple, Dict, Any, Optional
from pathlib import Path
import json
import tempfile
import subprocess

from app.core.config import settings

logger = logging.getLogger(__name__)

class VideoAnalyzer:
    @staticmethod
    async def analyze_energy(audio_path: str) -> np.ndarray:
        """
        Analyze audio energy levels to find potential viral moments
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Array of energy values
        """
        # Load audio file
        y, sr = librosa.load(audio_path, sr=None)
        
        # Compute frame-wise energy (RMS)
        frame_length = 2048
        hop_length = 512
        rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
        
        # Return energy array
        return rms
    
    @staticmethod
    async def extract_audio(video_path: Path) -> Path:
        """
        Extract audio from video file using ffmpeg
        
        Args:
            video_path: Path to the video file
            
        Returns:
            Path to the extracted audio file
        """
        audio_path = Path(tempfile.gettempdir()) / f"{video_path.stem}_audio.wav"
        
        cmd = [
            "ffmpeg", "-i", str(video_path),
            "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2",
            str(audio_path), "-y"
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            return audio_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Error extracting audio: {e}")
            raise
    
    @staticmethod
    async def find_viral_segments(
        video_path: Path,
        use_whisper: bool = False,
        use_gpt: bool = False
    ) -> List[Tuple[float, float, float]]:
        """
        Find potentially viral segments in the video
        
        Args:
            video_path: Path to the video file
            use_whisper: Whether to use Whisper for transcription
            use_gpt: Whether to use GPT-4 for analyzing virality
            
        Returns:
            List of tuples with (start_time, end_time, confidence)
        """
        # Extract audio from video
        audio_path = await VideoAnalyzer.extract_audio(video_path)
        
        # Analyze audio energy
        energy = await VideoAnalyzer.analyze_energy(str(audio_path))
        
        # Get clip candidates based on energy patterns
        segments = []
        
        # 1. Normalize energy data
        energy_norm = (energy - np.mean(energy)) / np.std(energy)
        
        # 2. Find segments with high energy
        threshold = 1.5  # High energy threshold (1.5 std above mean)
        high_energy_frames = np.where(energy_norm > threshold)[0]
        
        # Group consecutive frames
        if len(high_energy_frames) > 0:
            # Find where the consecutive indices break
            breaks = np.where(np.diff(high_energy_frames) > 1)[0] + 1
            # Split the array at the breaks
            segments_idx = np.split(high_energy_frames, breaks)
            
            # Convert frame indices to time segments
            hop_length = 512
            sr = 44100
            for segment in segments_idx:
                if len(segment) == 0:
                    continue
                
                # Get the start and end times
                start_frame = segment[0]
                end_frame = segment[-1]
                
                # Convert to seconds
                start_time = start_frame * hop_length / sr
                end_time = end_frame * hop_length / sr
                
                # Calculate duration
                duration = end_time - start_time
                
                # Only keep segments of appropriate duration
                if (duration >= settings.MIN_CLIP_DURATION and 
                    duration <= settings.MAX_CLIP_DURATION):
                    # Calculate confidence based on energy level
                    confidence = float(np.mean(energy_norm[segment]))
                    segments.append((start_time, end_time, confidence))
        
        # Enhance with Whisper and GPT if enabled
        if use_whisper and settings.USE_WHISPER:
            segments = await WhisperTranscriber.enhance_segments(video_path, segments)
            
        if use_gpt and settings.USE_GPT:
            segments = await GPTEnhancer.enhance_segments(video_path, segments)
        
        # Sort by confidence (highest first)
        segments.sort(key=lambda x: x[2], reverse=True)
        
        # Return top N segments
        return segments[:settings.MAX_CLIPS]
        
    @staticmethod
    def format_timestamp(seconds: float) -> str:
        """Convert seconds to 'HH:MM:SS' format"""
        m, s = divmod(int(seconds), 60)
        h, m = divmod(m, 60)
        return f"{h:02d}:{m:02d}:{s:02d}"


class WhisperTranscriber:
    @staticmethod
    async def transcribe_video(video_path: Path) -> Dict[str, Any]:
        """
        Transcribe video using Whisper API
        
        Args:
            video_path: Path to the video file
            
        Returns:
            Transcription data
        """
        if not settings.USE_WHISPER or not settings.OPENAI_API_KEY:
            return {}
        
        # Extract audio
        audio_path = await VideoAnalyzer.extract_audio(video_path)
        
        # This is a stub - in production, you'd use the OpenAI Whisper API
        # or the local Whisper model
        
        # Mock implementation that would be replaced with actual API call
        logger.info(f"Would transcribe {audio_path}")
        
        # Return empty transcription for now
        return {
            "segments": []
        }
    
    @staticmethod
    async def enhance_segments(
        video_path: Path,
        segments: List[Tuple[float, float, float]]
    ) -> List[Tuple[float, float, float]]:
        """
        Enhance segment selection using transcription
        
        Args:
            video_path: Path to the video file
            segments: List of segments with (start, end, confidence)
            
        Returns:
            Enhanced segments with updated confidence scores
        """
        # Get transcription
        transcription = await WhisperTranscriber.transcribe_video(video_path)
        
        # In a real implementation, you would:
        # 1. Analyze transcription segments
        # 2. Adjust confidence scores based on content
        # 3. Return enhanced segments
        
        return segments


class GPTEnhancer:
    @staticmethod
    async def enhance_segments(
        video_path: Path,
        segments: List[Tuple[float, float, float]],
    ) -> List[Tuple[float, float, float]]:
        """
        Enhance segment selection using GPT-4
        
        Args:
            video_path: Path to the video file
            segments: List of segments with (start, end, confidence)
            
        Returns:
            Enhanced segments with updated confidence scores
        """
        if not settings.USE_GPT or not settings.OPENAI_API_KEY:
            return segments
        
        # This is a stub - in production, you'd use the OpenAI GPT-4 API
        # to analyze transcribed segments and adjust confidence scores
        
        # Mock implementation
        logger.info(f"Would enhance segments using GPT-4 for {video_path}")
        
        return segments
