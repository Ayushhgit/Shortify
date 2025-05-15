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

class VideoAnalyzer:
    @staticmethod
    async def analyze_energy(audio_path: str) -> np.ndarray:
        """Analyze audio energy and rhythmic activity to find interesting segments."""
        logger.info(f"Analyzing energy for: {audio_path}")
        try:
            y, sr = librosa.load(audio_path, sr=None)
            logger.info(f"Loaded audio: y shape = {y.shape}, sr = {sr}")
        except Exception as e:
            logger.error(f"Error loading audio in analyze_energy: {e}")
            raise

        hop_length = 512
        rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
        onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)

        min_len = min(len(rms), len(onset_env))
        rms = rms[:min_len]
        onset_env = onset_env[:min_len]
        energy = 0.7 * rms + 0.3 * onset_env

        logger.debug(f"Combined energy (first 10): {energy[:10]}")
        return energy

    @staticmethod
    async def extract_audio(video_path: Path, volume_boost: int = 10) -> Path:
        """Extract audio from video with optional volume boost."""
        audio_path = Path(tempfile.gettempdir()) / f"{video_path.stem}_audio.wav"
        cmd = [
            "ffmpeg", "-i", str(video_path),
            "-vn", "-af", f"volume={volume_boost}dB",
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
        """Find the most engaging segments in a video using audio analysis."""
        from app.utils.transcriber import WhisperTranscriber
        from app.utils.enhancer import GPTEnhancer

        audio_path = await VideoAnalyzer.extract_audio(video_path)
        energy = await VideoAnalyzer.analyze_energy(str(audio_path))
        segments = []

        energy = np.nan_to_num(energy)
        energy = np.clip(energy, 0, None)

        if np.max(energy) - np.min(energy) == 0:
            energy_norm = np.zeros_like(energy)
        else:
            energy_norm = (energy - np.min(energy)) / (np.max(energy) - np.min(energy))

        if len(energy_norm) > 0:
            mean_energy = np.mean(energy_norm)
            std_energy = np.std(energy_norm)
            threshold = max(mean_energy + (0.5 * std_energy), 0.3)
            logger.info(f"Dynamic threshold: {threshold:.4f} (mean={mean_energy:.4f}, std={std_energy:.4f})")
            high_energy_frames = np.where(energy_norm >= threshold)[0]
        else:
            high_energy_frames = []

        logger.info(f"High energy frames found: {len(high_energy_frames)}")

        if len(high_energy_frames) > 0:
            avg_frame_gap = np.mean(np.diff(high_energy_frames)) if len(high_energy_frames) > 1 else 0
            gap_tolerance = max(50, int(2 * avg_frame_gap))
            logger.debug(f"Using adaptive gap tolerance: {gap_tolerance} frames")

            breaks = np.where(np.diff(high_energy_frames) > gap_tolerance)[0] + 1
            segments_idx = np.split(high_energy_frames, breaks)

            hop_length = 512
            sr = 44100

            for i, segment in enumerate(segments_idx):
                if len(segment) == 0:
                    continue

                start_time = segment[0] * hop_length / sr
                end_time = segment[-1] * hop_length / sr
                duration = end_time - start_time

                logger.debug(f"Segment candidate duration: {duration:.2f}s")
                logger.debug(f"Segment: start={start_time:.2f}, end={end_time:.2f}, duration={duration:.2f}")

                min_duration = getattr(settings, 'MIN_CLIP_DURATION', 5.0)
                max_duration = getattr(settings, 'MAX_CLIP_DURATION', 60.0)

                if duration < min_duration:
                    extension_frames = int((min_duration - duration) * sr / hop_length)
                    new_end_frame = min(segment[-1] + extension_frames, len(energy_norm) - 1)
                    new_start_frame = max(0, segment[0] - max(0, extension_frames - (new_end_frame - segment[-1])))

                    start_time = new_start_frame * hop_length / sr
                    end_time = new_end_frame * hop_length / sr
                    duration = end_time - start_time
                    segment = np.arange(new_start_frame, new_end_frame + 1)

                    logger.debug(f"Extended segment {i}: {start_time:.2f}-{end_time:.2f}s")

                confidence = float(np.mean(energy_norm[segment]))

                if min_duration <= duration <= max_duration:
                    segments.append((start_time, end_time, confidence))
                    logger.info(f"Found segment: {start_time:.2f}-{end_time:.2f}s (confidence={confidence:.2f})")

        if not segments:
            logger.warning("No high-energy segments found. Creating fallback segments.")
            try:
                video = mp.VideoFileClip(str(video_path))
                video_duration = video.duration
                video.close()
            except Exception as e:
                logger.error(f"Could not read video duration: {e}")
                video_duration = 60

            min_duration = getattr(settings, 'MIN_CLIP_DURATION', 5.0)
            max_duration = getattr(settings, 'MAX_CLIP_DURATION', 60.0)
            optimal_duration = min(30.0, max_duration)

            num_segments = max(1, int(video_duration / optimal_duration))
            for i in range(num_segments):
                start_time = i * optimal_duration
                end_time = min(start_time + optimal_duration, video_duration)
                if end_time - start_time >= min_duration:
                    confidence = 0.5 if len(energy_norm) == 0 else float(
                        np.mean(energy_norm[int(start_time * sr / hop_length):int(end_time * sr / hop_length)]))
                    segments.append((start_time, end_time, confidence))

            if video_duration > num_segments * optimal_duration:
                start_time = num_segments * optimal_duration
                end_time = video_duration
                if end_time - start_time >= min_duration:
                    confidence = 0.5 if len(energy_norm) == 0 else float(
                        np.mean(energy_norm[int(start_time * sr / hop_length):int(end_time * sr / hop_length)]))
                    segments.append((start_time, end_time, confidence))

        logger.info(f"Total segments selected: {len(segments)}")

        if use_whisper and settings.USE_WHISPER:
            segments = await WhisperTranscriber.enhance_segments(video_path, segments)
        if use_gpt and settings.USE_GPT:
            segments = await GPTEnhancer.enhance_segments(video_path, segments)

        segments.sort(key=lambda x: x[2], reverse=True)
        return segments[:getattr(settings, 'MAX_CLIPS', 5)]

    @staticmethod
    def format_timestamp(seconds: float) -> str:
        """Convert seconds to HH:MM:SS format."""
        m, s = divmod(int(seconds), 60)
        h, m = divmod(m, 60)
        return f"{h:02d}:{m:02d}:{s:02d}"


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
