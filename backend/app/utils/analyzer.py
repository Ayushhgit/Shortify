import os
import numpy as np
import librosa
import logging
from pathlib import Path
import tempfile
import subprocess
from typing import List, Tuple, Dict, Any
import moviepy.editor as mp

# Import settings from the core config
from app.core.config import settings

# Logger setup
logger = logging.getLogger(__name__)

# VideoAnalyzer Class
class VideoAnalyzer:
    @staticmethod
    async def analyze_energy(audio_path: str) -> np.ndarray:
        logger.info(f"Analyzing energy for: {audio_path}")
        try:
            y, sr = librosa.load(audio_path, sr=None)
            logger.info(f"Loaded audio: y shape = {y.shape}, sr = {sr}")
        except Exception as e:
            logger.error(f"Error loading audio in analyze_energy: {e}")
            raise

        hop_length = 512

        # RMS (volume)
        rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]

        # Onset strength (rhythmic activity)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)

        # Combine both
        min_len = min(len(rms), len(onset_env))
        rms = rms[:min_len]
        onset_env = onset_env[:min_len]
        energy = 0.7 * rms + 0.3 * onset_env

        logger.info(f"Combined energy (first 10): {energy[:10]}")
        return energy

    @staticmethod
    async def extract_audio(video_path: Path) -> Path:
        audio_path = Path(tempfile.gettempdir()) / f"{video_path.stem}_audio.wav"
        cmd = [
            "ffmpeg", "-i", str(video_path),
            "-vn", "-af", "volume=50dB",
            "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2",
            str(audio_path), "-y"
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            logger.info(f"Audio extracted to: {audio_path}")
            return audio_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Error extracting audio: {e.stderr.decode()}")
            raise

    @staticmethod
    async def find_viral_segments(
        video_path: Path,
        use_whisper: bool = False,
        use_gpt: bool = False
    ) -> List[Tuple[float, float, float]]:
        # Lazy Import to avoid circular import
        from app.utils.transcriber import WhisperTranscriber
        from app.utils.enhancer import GPTEnhancer

        audio_path = await VideoAnalyzer.extract_audio(video_path)
        energy = await VideoAnalyzer.analyze_energy(str(audio_path))
        segments = []

        energy = np.nan_to_num(energy)
        energy = np.clip(energy, 0, None)  # ensure non-negative

        if np.max(energy) - np.min(energy) == 0:
            energy_norm = np.zeros_like(energy)
        else:
            energy_norm = (energy - np.min(energy)) / (np.max(energy) - np.min(energy))

        if len(energy_norm) == 0:
            high_energy_frames = []
        else:
            threshold = np.percentile(energy_norm, 85)  # top 15%
            high_energy_frames = np.where(energy_norm >= threshold)[0]

        logger.info(f"High energy frames found: {len(high_energy_frames)}")

        if len(high_energy_frames) > 0:
            breaks = np.where(np.diff(high_energy_frames) > 1)[0] + 1
            segments_idx = np.split(high_energy_frames, breaks)

            hop_length = 512
            sr = 44100

            for segment in segments_idx:
                if len(segment) == 0:
                    continue
                start_time = segment[0] * hop_length / sr
                end_time = segment[-1] * hop_length / sr
                duration = end_time - start_time

                if settings.MIN_CLIP_DURATION <= duration <= settings.MAX_CLIP_DURATION:
                    confidence = float(np.mean(energy_norm[segment]))
                    segments.append((start_time, end_time, confidence))
                    logger.info(f"Segment: {start_time:.2f}-{end_time:.2f}s (confidence={confidence:.2f})")

        if not segments:
            logger.warning("No high-energy segments found. Falling back to default segment.")
            try:
                video = mp.VideoFileClip(str(video_path))
                video_duration = video.duration
            except Exception as e:
                logger.error(f"Could not read video duration: {e}")
                video_duration = 30

            fallback_start = 0.0
            fallback_end = min(video_duration, settings.MAX_CLIP_DURATION)
            fallback_confidence = 0.1
            segments = [(fallback_start, fallback_end, fallback_confidence)]

        logger.info(f"Total segments selected: {len(segments)}")

        if use_whisper and settings.USE_WHISPER:
            segments = await WhisperTranscriber.enhance_segments(video_path, segments)
        if use_gpt and settings.USE_GPT:
            segments = await GPTEnhancer.enhance_segments(video_path, segments)

        segments.sort(key=lambda x: x[2], reverse=True)
        return segments[:settings.MAX_CLIPS]

    @staticmethod
    def format_timestamp(seconds: float) -> str:
        m, s = divmod(int(seconds), 60)
        h, m = divmod(m, 60)
        return f"{h:02d}:{m:02d}:{s:02d}"


# GPTEnhancer Class
class GPTEnhancer:
    @staticmethod
    async def enhance_segments(
        video_path: Path,
        segments: List[Tuple[float, float, float]]
    ) -> List[Tuple[float, float, float]]:
        if not settings.USE_GPT or not settings.OPENAI_API_KEY:
            logger.info("GPT enhancement skipped.")
            return segments
        logger.info(f"Mock GPT enhancement for {video_path}")
        return segments


# WhisperTranscriber Class
class WhisperTranscriber:
    @staticmethod
    async def transcribe_video(video_path: Path) -> Dict[str, Any]:
        if not settings.USE_WHISPER or not settings.OPENAI_API_KEY:
            logger.info("Whisper transcription skipped.")
            return {}
        audio_path = await VideoAnalyzer.extract_audio(video_path)
        logger.info(f"Mock transcription for {audio_path}")
        return {"segments": []}

    @staticmethod
    async def enhance_segments(
        video_path: Path,
        segments: List[Tuple[float, float, float]]
    ) -> List[Tuple[float, float, float]]:
        _ = await WhisperTranscriber.transcribe_video(video_path)
        return segments
