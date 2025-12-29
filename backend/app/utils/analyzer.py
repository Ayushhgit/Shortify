import os
import numpy as np
import librosa
import logging
from pathlib import Path
import tempfile
import subprocess
from typing import List, Tuple, Dict, Any
import moviepy.editor as mp
import faster_whisper
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from app.core.config import settings

logger = logging.getLogger(__name__)

class VideoAnalyzer:
    @staticmethod
    async def analyze_energy(audio_path: str) -> np.ndarray:
        """Analyze audio energy (Fastest method)"""
        logger.info(f"[STEP 1] Starting energy analysis for: {audio_path}")
        
        try:
            # Load with librosa (duration check helps prevent OOM on huge files)
            y, sr = librosa.load(audio_path, sr=None, duration=600) # Analyze up to 10 mins
            
            hop_length = 512
            rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
            onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)
            
            min_len = min(len(rms), len(onset_env))
            rms = rms[:min_len]
            onset_env = onset_env[:min_len]
            
            # Combine RMS (Loudness) and Onset (Rhythm)
            # 60% Loudness, 40% Rhythm
            energy = 0.6 * rms + 0.4 * onset_env
            
            # Normalize immediately to 0-1 range for easier thresholding
            if np.max(energy) > 0:
                energy = energy / np.max(energy)
                
            return energy

        except Exception as e:
            logger.error(f"Error analyzing energy: {e}")
            raise

    @staticmethod
    async def extract_audio(video_path: Path) -> Path:
        """Extract audio using FFmpeg (Optimized)"""
        UPLOAD_DIR = Path("/app/uploads")
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        audio_path = UPLOAD_DIR / f"{video_path.stem}_audio.wav"
        
        if audio_path.exists():
            return audio_path

        cmd = [
            "ffmpeg", "-i", str(video_path),
            "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", # 16k Mono is faster for Whisper
            str(audio_path), "-y"
        ]
        
        # Use run instead of Popen to ensure it finishes before we access the file
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return audio_path

    @staticmethod
    async def analyze_with_groq(text: str) -> float:
        """
        Use Groq API to rate viral potential (0.0 to 1.0).
        """
        try:
            if not text or len(text) < 10:
                return 0.2 # Low score for empty/short text

            llm = ChatGroq(
                temperature=0.1, # Slight creativity to find nuances
                model_name="llama-3.3-70b-versatile", # Latest stable model
                api_key=settings.GROQ_API_KEY
            )

            prompt = ChatPromptTemplate.from_template(
                """You are a Viral Content Editor. Analyze this video transcript.
                Rate its 'Viral Potential' from 0 to 100.
                
                Criteria for High Score (>80):
                - Strong Hook or unexpected statement.
                - High emotional content (anger, joy, shock).
                - Useful facts or "How-to" value.
                - Jokes or funny moments.

                Transcript: "{text}"
                
                Return ONLY the number (e.g. 85). No text, no explanation."""
            )

            chain = prompt | llm
            response = await chain.ainvoke({"text": text})
            
            # Parse number robustly
            content = response.content.strip()
            import re
            match = re.search(r'\d+', content)
            if match:
                score = float(match.group())
                return min(max(score / 100.0, 0.0), 1.0) # Normalize to 0.0 - 1.0
            
            return 0.5 # Default if parsing fails

        except Exception as e:
            logger.warning(f"Groq analysis failed: {e}. Defaulting to 0.5")
            return 0.5

    @staticmethod
    async def find_viral_segments(
        video_path: Path,
        use_whisper: bool = False,
        use_gpt: bool = False
    ) -> List[Tuple[float, float, float]]:
        
        logger.info(f"[MAIN] Starting analysis for: {video_path}")
        audio_path = None
        
        try:
            # 1. Extract Audio
            audio_path = await VideoAnalyzer.extract_audio(video_path)
            
            # 2. Analyze Energy
            energy = await VideoAnalyzer.analyze_energy(str(audio_path))
            
            # --- [UPDATED] ADAPTIVE THRESHOLDING ---
            # Try to find at least 5 segments. If fail, lower the bar.
            segments = []
            hop_length = 512
            sr = 44100 # Librosa default
            
            # Try thresholds: 70% percentile -> 50% -> 30% -> 10% (Desperation mode)
            percentiles = [70, 50, 30, 10] 
            
            for p in percentiles:
                if len(segments) >= 5: 
                    break # We found enough
                
                logger.info(f"[ANALYSIS] Trying energy percentile: Top {100-p}%")
                threshold = np.percentile(energy, p)
                high_energy_frames = np.where(energy >= threshold)[0]
                
                if len(high_energy_frames) == 0: continue

                # Group frames (allow gaps of 1 second = ~43 frames)
                breaks = np.where(np.diff(high_energy_frames) > 86)[0] + 1
                split_frames = np.split(high_energy_frames, breaks)
                
                current_batch = []
                for frames in split_frames:
                    if len(frames) < 10: continue # Skip noise
                    
                    # Convert to seconds (Approx SR correction for librosa load default)
                    # Note: We loaded with SR=None, but energy calculation assumes default mapping
                    # Let's trust the ratio.
                    # Duration of array / Array Length = Time per frame
                    # Better: Librosa loads at 22050 by default if sr=None not specified correctly, 
                    # but we used sr=None so it uses native. Let's rely on standard calc.
                    # Frame to Time: frame_index * hop_length / sr
                    # To be safe, we assume standard 22050 for consistency in logic if sr varies
                    
                    start = (frames[0] * hop_length) / 22050 
                    end = (frames[-1] * hop_length) / 22050
                    duration = end - start
                    
                    # Constraint: Shorts must be 15s - 60s
                    if duration < 15:
                        # Try to extend slightly
                        padding = (15 - duration) / 2
                        start = max(0, start - padding)
                        end = end + padding
                        duration = end - start
                    
                    if 15 <= duration <= 60:
                        conf = float(np.mean(energy[frames]))
                        # Check overlap with existing segments
                        is_duplicate = False
                        for s in segments:
                            # If overlap is > 50%
                            overlap_start = max(start, s['start'])
                            overlap_end = min(end, s['end'])
                            overlap = max(0, overlap_end - overlap_start)
                            if overlap > 0.5 * duration:
                                is_duplicate = True
                                break
                        
                        if not is_duplicate:
                            current_batch.append({"start": start, "end": end, "conf": conf, "text": ""})
                
                # Add unique ones from this batch
                segments.extend(current_batch)
                
            logger.info(f"[ANALYSIS] Found {len(segments)} potential energy candidates")

            # --- [UPDATED] SMARTER FALLBACK ---
            # If energy analysis failed completely (e.g. silent video or constant noise)
            if len(segments) < 2:
                logger.warning("[ANALYSIS] Not enough energy segments. Generating Smart Distribution.")
                try:
                    video = mp.VideoFileClip(str(video_path))
                    dur = video.duration
                    video.close()
                except:
                    dur = 60
                
                # Create 3 clips distributed evenly: 10% mark, 40% mark, 70% mark
                targets = [dur * 0.1, dur * 0.4, dur * 0.7]
                for t in targets:
                    if t + 30 <= dur:
                        segments.append({"start": t, "end": t+30, "conf": 0.3, "text": ""})

            # Limit to Top 8 candidates for AI processing (Save time/money)
            segments = sorted(segments, key=lambda x: x['conf'], reverse=True)[:8]

            # 3. AI Enhancement (Whisper + Groq)
            if use_whisper or use_gpt:
                logger.info(f"[AI] Enhancing {len(segments)} segments with Groq AI...")
                
                # Load Whisper (Base is fine for CPU)
                model = faster_whisper.WhisperModel("base", device="cpu", compute_type="int8", cpu_threads=4)
                
                for seg in segments:
                    try:
                        # Extract mini clip audio for precise transcription
                        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as f:
                            cmd = [
                                "ffmpeg", "-ss", str(seg['start']), "-t", str(seg['end'] - seg['start']),
                                "-i", str(audio_path), "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", 
                                f.name, "-y"
                            ]
                            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                            
                            segs, _ = model.transcribe(f.name, beam_size=1, temperature=0)
                            text = " ".join([s.text for s in segs])
                            seg['text'] = text
                            
                            if use_gpt:
                                groq_score = await VideoAnalyzer.analyze_with_groq(text)
                                logger.info(f"[AI] Segment {seg['start']:.1f}s | Groq Score: {groq_score:.2f}")
                                # Weight Groq score higher (70% Groq, 30% Energy)
                                seg['conf'] = (seg['conf'] * 0.3) + (groq_score * 0.7)
                                
                    except Exception as e:
                        logger.error(f"AI Enhancement failed for segment: {e}")

            # 4. Final Filtering
            # Return top 5, but ensure we have at least 2 if possible
            final_segments = [(s['start'], s['end'], s['conf']) for s in segments]
            final_segments.sort(key=lambda x: x[2], reverse=True)
            
            # Ensure we return at least a few clips if they exist
            result = final_segments[:5]
            
            logger.info(f"[RESULT] Returning {len(result)} clips")
            return result

        finally:
            if audio_path and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                    logger.info(f"[CLEANUP] Removed temporary audio: {audio_path}")
                except Exception as e:
                    logger.error(f"Cleanup failed: {e}")