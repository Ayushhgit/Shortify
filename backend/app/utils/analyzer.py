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
        logger.info(f"[STEP 1] Starting energy analysis for: {audio_path}")
        
        try:
            # Check if audio file exists
            if not os.path.exists(audio_path):
                logger.error(f"[STEP 1] Audio file does not exist: {audio_path}")
                raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
            file_size = os.path.getsize(audio_path)
            logger.info(f"[STEP 1] Audio file exists, size: {file_size} bytes")
            
            y, sr = librosa.load(audio_path, sr=None)
            logger.info(f"[STEP 1] Audio loaded successfully: y.shape={y.shape}, sr={sr}, duration={len(y)/sr:.2f}s")
            
            if len(y) == 0:
                logger.error(f"[STEP 1] Audio array is empty!")
                raise ValueError("Loaded audio array is empty")
                
        except Exception as e:
            logger.error(f"[STEP 1] Error loading audio: {e}")
            raise

        logger.info(f"[STEP 2] Computing audio features...")
        hop_length = 512
        
        try:
            # Compute RMS energy
            rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
            logger.info(f"[STEP 2] RMS computed: shape={rms.shape}, min={np.min(rms):.6f}, max={np.max(rms):.6f}")
            
            # Compute onset strength
            onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)
            logger.info(f"[STEP 2] Onset strength computed: shape={onset_env.shape}, min={np.min(onset_env):.6f}, max={np.max(onset_env):.6f}")
            
        except Exception as e:
            logger.error(f"[STEP 2] Error computing audio features: {e}")
            raise

        # Align arrays
        min_len = min(len(rms), len(onset_env))
        logger.info(f"[STEP 3] Aligning arrays: rms_len={len(rms)}, onset_len={len(onset_env)}, min_len={min_len}")
        
        rms = rms[:min_len]
        onset_env = onset_env[:min_len]
        
        # Combine features
        energy = 0.7 * rms + 0.3 * onset_env
        logger.info(f"[STEP 3] Combined energy: shape={energy.shape}, min={np.min(energy):.6f}, max={np.max(energy):.6f}")
        logger.debug(f"[STEP 3] Energy sample (first 10): {energy[:10]}")
        
        return energy

    @staticmethod
    async def extract_audio(video_path: Path, volume_boost: int = 10) -> Path:
        """Extract audio from video with optional volume boost."""
        logger.info(f"[AUDIO EXTRACT] Starting audio extraction from: {video_path}")
        
        # Check if video file exists
        if not video_path.exists():
            logger.error(f"[AUDIO EXTRACT] Video file does not exist: {video_path}")
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        file_size = video_path.stat().st_size
        logger.info(f"[AUDIO EXTRACT] Video file exists, size: {file_size} bytes")
        
        UPLOAD_DIR = Path("/app/uploads")
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        audio_path = UPLOAD_DIR / f"{video_path.stem}_audio.wav"
        
        logger.info(f"[AUDIO EXTRACT] Output audio path: {audio_path}")
        
        cmd = [
            "ffmpeg", "-i", str(video_path),
            "-vn", "-af", f"volume={volume_boost}dB",
            "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2",
            str(audio_path), "-y"
        ]
        
        logger.info(f"[AUDIO EXTRACT] FFmpeg command: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            logger.info(f"[AUDIO EXTRACT] FFmpeg completed successfully")
            logger.debug(f"[AUDIO EXTRACT] FFmpeg stdout: {result.stdout}")
            
            if audio_path.exists():
                audio_size = audio_path.stat().st_size
                logger.info(f"[AUDIO EXTRACT] Audio file created successfully, size: {audio_size} bytes")
            else:
                logger.error(f"[AUDIO EXTRACT] Audio file was not created!")
                raise FileNotFoundError("Audio extraction failed - output file not found")
                
            return audio_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"[AUDIO EXTRACT] FFmpeg failed with return code {e.returncode}")
            logger.error(f"[AUDIO EXTRACT] FFmpeg stderr: {e.stderr}")
            logger.error(f"[AUDIO EXTRACT] FFmpeg stdout: {e.stdout}")
            raise

    @staticmethod
    async def find_viral_segments(
        video_path: Path,
        use_whisper: bool = False,
        use_gpt: bool = False
    ) -> List[Tuple[float, float, float]]:
        """Find the most engaging segments in a video using audio analysis."""
        logger.info(f"[MAIN] Starting viral segment detection for: {video_path}")
        logger.info(f"[MAIN] Settings: use_whisper={use_whisper}, use_gpt={use_gpt}")
        
        # Import here to avoid circular imports
        from app.utils.transcriber import WhisperTranscriber
        from app.utils.enhancer import LangchainHFEnhancer

        try:
            # Extract audio
            logger.info(f"[MAIN] Step 1: Extracting audio...")
            audio_path = await VideoAnalyzer.extract_audio(video_path)
            logger.info(f"[MAIN] Audio extraction completed: {audio_path}")
            
            # Analyze energy
            logger.info(f"[MAIN] Step 2: Analyzing energy...")
            energy = await VideoAnalyzer.analyze_energy(str(audio_path))
            logger.info(f"[MAIN] Energy analysis completed: energy.shape={energy.shape}")
            
        except Exception as e:
            logger.error(f"[MAIN] Error in audio processing: {e}")
            raise

        segments = []
        logger.info(f"[MAIN] Step 3: Processing energy data...")

        # Handle NaN and negative values
        nan_count = np.sum(np.isnan(energy))
        neg_count = np.sum(energy < 0)
        logger.info(f"[MAIN] Energy preprocessing: NaN count={nan_count}, negative count={neg_count}")
        
        energy = np.nan_to_num(energy)  # Replace NaNs with 0s
        energy = np.clip(energy, 0, None)  # Clip negative values to 0
        
        logger.info(f"[MAIN] After preprocessing: min={np.min(energy):.6f}, max={np.max(energy):.6f}")

        # Normalize energy
        energy_range = np.max(energy) - np.min(energy)
        logger.info(f"[MAIN] Energy range: {energy_range:.6f}")
        
        if energy_range == 0:
            logger.warning(f"[MAIN] Energy range is zero - all values are the same!")
            energy_norm = np.zeros_like(energy)
        else:
            energy_norm = (energy - np.min(energy)) / energy_range
            
        logger.info(f"[MAIN] Normalized energy: min={np.min(energy_norm):.6f}, max={np.max(energy_norm):.6f}")

        # Thresholding High-Energy Audio Frames
        logger.info(f"[MAIN] Step 4: Finding high-energy frames...")
        
        if len(energy_norm) > 0:
            mean_energy = np.mean(energy_norm)
            std_energy = np.std(energy_norm)
            threshold = max(mean_energy + (0.5 * std_energy), 0.3)
            logger.info(f"[MAIN] Energy statistics: mean={mean_energy:.4f}, std={std_energy:.4f}")
            logger.info(f"[MAIN] Dynamic threshold: {threshold:.4f}")
            
            high_energy_frames = np.where(energy_norm >= threshold)[0]
            logger.info(f"[MAIN] High energy frames found: {len(high_energy_frames)} out of {len(energy_norm)} total frames")
            
            if len(high_energy_frames) > 0:
                logger.info(f"[MAIN] High energy frame indices: first 10 = {high_energy_frames[:10]}")
            
        else:
            logger.error(f"[MAIN] Energy array is empty!")
            high_energy_frames = []

        # Group Consecutive High-Energy Frames into Segments
        logger.info(f"[MAIN] Step 5: Grouping frames into segments...")
        
        if len(high_energy_frames) > 0:
            # Calculate gap tolerance
            if len(high_energy_frames) > 1:
                avg_frame_gap = np.mean(np.diff(high_energy_frames))
                logger.info(f"[MAIN] Average frame gap: {avg_frame_gap:.2f}")
            else:
                avg_frame_gap = 0
                logger.info(f"[MAIN] Only one high-energy frame found")
                
            gap_tolerance = max(50, int(2 * avg_frame_gap))
            logger.info(f"[MAIN] Gap tolerance: {gap_tolerance} frames")

            # Find breaks between segments
            frame_diffs = np.diff(high_energy_frames)
            large_gaps = frame_diffs > gap_tolerance
            breaks = np.where(large_gaps)[0] + 1
            logger.info(f"[MAIN] Found {len(breaks)} breaks in high-energy sequence")
            
            # Split into segments
            segments_idx = np.split(high_energy_frames, breaks)
            logger.info(f"[MAIN] Split into {len(segments_idx)} potential segments")

            hop_length = 512
            sr = 44100

            # Convert Frame Indices to Time + Adjust Durations
            logger.info(f"[MAIN] Step 6: Converting segments to time...")
            
            min_duration = getattr(settings, 'MIN_CLIP_DURATION', 15.0)
            max_duration = getattr(settings, 'MAX_CLIP_DURATION', 60.0)
            logger.info(f"[MAIN] Duration constraints: min={min_duration}s, max={max_duration}s")
            
            for i, segment in enumerate(segments_idx):
                if len(segment) == 0:
                    logger.debug(f"[MAIN] Segment {i}: empty, skipping")
                    continue

                start_time = segment[0] * hop_length / sr
                end_time = segment[-1] * hop_length / sr
                duration = end_time - start_time

                logger.info(f"[MAIN] Segment {i}: frames {segment[0]}-{segment[-1]}, time {start_time:.2f}-{end_time:.2f}s, duration {duration:.2f}s")

                # Extend segment if too short
                if duration < min_duration:
                    logger.info(f"[MAIN] Segment {i} too short ({duration:.2f}s), extending...")
                    extension_frames = int((min_duration - duration) * sr / hop_length)
                    new_end_frame = min(segment[-1] + extension_frames, len(energy_norm) - 1)
                    new_start_frame = max(0, segment[0] - max(0, extension_frames - (new_end_frame - segment[-1])))

                    start_time = new_start_frame * hop_length / sr
                    end_time = new_end_frame * hop_length / sr
                    duration = end_time - start_time
                    segment = np.arange(new_start_frame, new_end_frame + 1)

                    logger.info(f"[MAIN] Segment {i} extended: {start_time:.2f}-{end_time:.2f}s, new duration {duration:.2f}s")

                # Calculate confidence score
                confidence = float(np.mean(energy_norm[segment]))
                logger.info(f"[MAIN] Segment {i} confidence: {confidence:.4f}")

                # Check duration constraints
                if min_duration <= duration <= max_duration:
                    segments.append((start_time, end_time, confidence))
                    logger.info(f"[MAIN] ✓ Segment {i} accepted: {start_time:.2f}-{end_time:.2f}s (confidence={confidence:.2f})")
                else:
                    logger.info(f"[MAIN] ✗ Segment {i} rejected: duration {duration:.2f}s outside constraints")

        logger.info(f"[MAIN] Step 7: Segment processing complete. Found {len(segments)} valid segments")

        # Fallback segment creation if no segments found
        if not segments:
            logger.warning("[MAIN] No high-energy segments found. Creating fallback segments...")
            try:
                video = mp.VideoFileClip(str(video_path))
                video_duration = video.duration
                video.close()
                logger.info(f"[MAIN] Video duration: {video_duration:.2f}s")
            except Exception as e:
                logger.error(f"[MAIN] Could not read video duration: {e}")
                video_duration = 60
                logger.info(f"[MAIN] Using default duration: {video_duration}s")

            min_duration = getattr(settings, 'MIN_CLIP_DURATION', 15.0)
            max_duration = getattr(settings, 'MAX_CLIP_DURATION', 60.0)
            optimal_duration = min(30.0, max_duration)
            
            logger.info(f"[MAIN] Fallback settings: optimal_duration={optimal_duration}s")

            num_segments = max(1, int(video_duration / optimal_duration))
            logger.info(f"[MAIN] Creating {num_segments} fallback segments")
            
            for i in range(num_segments):
                start_time = i * optimal_duration
                end_time = min(start_time + optimal_duration, video_duration)
                segment_duration = end_time - start_time
                
                logger.info(f"[MAIN] Fallback segment {i}: {start_time:.2f}-{end_time:.2f}s, duration {segment_duration:.2f}s")
                
                if segment_duration >= min_duration:
                    if len(energy_norm) == 0:
                        confidence = 0.5
                        logger.info(f"[MAIN] Fallback segment {i}: using default confidence 0.5 (no energy data)")
                    else:
                        start_frame = int(start_time * sr / hop_length)
                        end_frame = int(end_time * sr / hop_length)
                        start_frame = max(0, min(start_frame, len(energy_norm) - 1))
                        end_frame = max(start_frame + 1, min(end_frame, len(energy_norm)))
                        
                        confidence = float(np.mean(energy_norm[start_frame:end_frame]))
                        logger.info(f"[MAIN] Fallback segment {i}: calculated confidence {confidence:.4f} from frames {start_frame}-{end_frame}")
                        
                    segments.append((start_time, end_time, confidence))
                    logger.info(f"[MAIN] ✓ Fallback segment {i} added")
                else:
                    logger.info(f"[MAIN] ✗ Fallback segment {i} too short: {segment_duration:.2f}s")

            # Handle remaining duration
            if video_duration > num_segments * optimal_duration:
                start_time = num_segments * optimal_duration
                end_time = video_duration
                segment_duration = end_time - start_time
                
                logger.info(f"[MAIN] Final fallback segment: {start_time:.2f}-{end_time:.2f}s, duration {segment_duration:.2f}s")
                
                if segment_duration >= min_duration:
                    if len(energy_norm) == 0:
                        confidence = 0.5
                    else:
                        start_frame = int(start_time * sr / hop_length)
                        end_frame = int(end_time * sr / hop_length)
                        start_frame = max(0, min(start_frame, len(energy_norm) - 1))
                        end_frame = max(start_frame + 1, min(end_frame, len(energy_norm)))
                        confidence = float(np.mean(energy_norm[start_frame:end_frame]))
                        
                    segments.append((start_time, end_time, confidence))
                    logger.info(f"[MAIN] ✓ Final fallback segment added")

        logger.info(f"[MAIN] Step 8: Total segments before enhancement: {len(segments)}")
        for i, (start, end, conf) in enumerate(segments):
            logger.info(f"[MAIN] Segment {i}: {start:.2f}-{end:.2f}s, confidence={conf:.4f}")

        # Enhancement steps
        if use_whisper and settings.USE_WHISPER:
            logger.info(f"[MAIN] Step 9: Applying Whisper enhancement...")
            try:
                segments = await WhisperTranscriber.enhance_segments(video_path, segments)
                logger.info(f"[MAIN] Whisper enhancement completed: {len(segments)} segments")
            except Exception as e:
                logger.error(f"[MAIN] Whisper enhancement failed: {e}")
                
        if use_gpt and settings.USE_GPT:
            logger.info(f"[MAIN] Step 10: Applying GPT enhancement...")
            try:
                segments = await LangchainHFEnhancer.enhance_segments(video_path, segments)
                logger.info(f"[MAIN] GPT enhancement completed: {len(segments)} segments")
            except Exception as e:
                logger.error(f"[MAIN] GPT enhancement failed: {e}")

        # Final sorting and limiting
        logger.info(f"[MAIN] Step 11: Final processing...")
        segments.sort(key=lambda x: x[2], reverse=True)
        max_clips = getattr(settings, 'MAX_CLIPS', 5)
        final_segments = segments[:max_clips]
        
        logger.info(f"[MAIN] Final result: {len(final_segments)} segments (limited to {max_clips})")
        
        for i, (start, end, conf) in enumerate(final_segments):
            logger.info(f"[MAIN] Final segment {i}: {start:.2f}-{end:.2f}s, confidence={conf:.4f}")
            
        if not final_segments:
            logger.error(f"[MAIN] ❌ NO SEGMENTS FOUND - this will cause the 'No segments found' error")
        else:
            logger.info(f"[MAIN] ✅ Successfully found {len(final_segments)} segments")
            
        return final_segments

    @staticmethod
    def format_timestamp(seconds: float) -> str:
        """Convert seconds to HH:MM:SS format."""
        m, s = divmod(int(seconds), 60)
        h, m = divmod(m, 60)
        return f"{h:02d}:{m:02d}:{s:02d}"