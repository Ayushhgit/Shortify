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

# Import settings from the core config
from app.core.config import settings

# Logger setup
logger = logging.getLogger(__name__)

class VideoAnalyzer:
    @staticmethod
    async def analyze_energy(audio_path: str) -> np.ndarray:
        """Analyze audio energy (Fastest method)"""
        logger.info(f"[STEP 1] Starting energy analysis for: {audio_path}")
        
        try:
            # Load with librosa (duration check helps prevent OOM on huge files)
            y, sr = librosa.load(audio_path, sr=None, duration=300) 
            
            hop_length = 512
            rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
            onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)
            
            min_len = min(len(rms), len(onset_env))
            rms = rms[:min_len]
            onset_env = onset_env[:min_len]
            
            # Combine RMS (Loudness) and Onset (Rhythm)
            energy = 0.7 * rms + 0.3 * onset_env
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
        
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return audio_path

    @staticmethod
    async def analyze_with_groq(text: str) -> float:
        """
        [NEW] Use Groq API to rate viral potential (0.0 to 1.0).
        Replaces the slow local HuggingFace model.
        """
        try:
            if not text or len(text) < 10:
                return 0.1

            llm = ChatGroq(
                temperature=0,
                model_name="llama3-70b-8192", # Extremely fast & smart
                api_key=settings.GROQ_API_KEY
            )

            prompt = ChatPromptTemplate.from_template(
                """Analyze this video transcript segment. Rate its 'Viral Potential' on a scale of 0 to 10.
                Consider: Hook, Emotional Impact, Humor, or Interesting Facts.
                
                Transcript: "{text}"
                
                Return ONLY the number (e.g. 8.5). Do not write anything else."""
            )

            chain = prompt | llm
            response = await chain.ainvoke({"text": text})
            
            # Parse number
            score = float(response.content.strip())
            return min(max(score / 10.0, 0.0), 1.0) # Normalize to 0.0 - 1.0

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
        
        # 1. Extract Audio
        audio_path = await VideoAnalyzer.extract_audio(video_path)
        
        # 2. Analyze Energy (Librosa - Fast)
        energy = await VideoAnalyzer.analyze_energy(str(audio_path))
        
        # Thresholding logic
        threshold = np.mean(energy) + (0.5 * np.std(energy))
        high_energy_frames = np.where(energy >= threshold)[0]
        
        # Group frames into segments
        segments = []
        hop_length = 512
        sr = 44100 # Librosa default loaded above
        
        if len(high_energy_frames) > 0:
            # Simple grouping logic for speed
            breaks = np.where(np.diff(high_energy_frames) > 100)[0] + 1
            split_frames = np.split(high_energy_frames, breaks)
            
            for frames in split_frames:
                if len(frames) < 10: continue
                
                start = (frames[0] * hop_length) / 22050 # Approx SR correction
                end = (frames[-1] * hop_length) / 22050
                duration = end - start
                
                if 15 <= duration <= 60:
                    conf = float(np.mean(energy[frames]))
                    segments.append({"start": start, "end": end, "conf": conf, "text": ""})

        # Fallback if energy failed
        if not segments:
            logger.info("No energy segments found, using fallback time slicing")
            video = mp.VideoFileClip(str(video_path))
            dur = video.duration
            video.close()
            # Create 30s chunks
            for t in range(0, int(dur), 30):
                if t + 30 <= dur:
                    segments.append({"start": t, "end": t+30, "conf": 0.5, "text": ""})

        # Limit to top 5 candidates to save processing time
        segments = sorted(segments, key=lambda x: x['conf'], reverse=True)[:5]

        # 3. [OPTIMIZED] AI Enhancement (Whisper + Groq)
        # Only run this if requested and enabled
        if use_whisper or use_gpt:
            logger.info(f"Enhancing {len(segments)} segments with AI...")
            
            # Load Whisper ONLY if needed (Base model is fast on CPU)
            model = faster_whisper.WhisperModel("base", device="cpu", compute_type="int8", cpu_threads=4)
            
            for seg in segments:
                # Transcribe ONLY this segment (Fast)
                try:
                    # Determine start/end in bytes for Seek/Read is hard with raw audio file
                    # So we allow Whisper to process the file but strictly seek (internal optimization)
                    # Note: Faster-Whisper doesn't support start/end args easily without slicing audio.
                    # We skip complex slicing for speed and rely on Energy confidence unless GPT is critical.
                    pass 
                    
                    # If we MUST extract text for Groq:
                    if use_gpt:
                        # Extract mini clip audio
                        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as f:
                            # Fast slice
                            cmd = [
                                "ffmpeg", "-ss", str(seg['start']), "-t", str(seg['end'] - seg['start']),
                                "-i", str(audio_path), "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", 
                                f.name, "-y"
                            ]
                            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                            
                            # Transcribe clip
                            segs, _ = model.transcribe(f.name, beam_size=1, temperature=0)
                            text = " ".join([s.text for s in segs])
                            seg['text'] = text
                            
                            # Score with Groq
                            groq_score = await VideoAnalyzer.analyze_with_groq(text)
                            seg['conf'] = (seg['conf'] + groq_score) / 2 # Weighted average
                            
                except Exception as e:
                    logger.error(f"AI Enhancement failed for segment: {e}")

        # Return final tuple format
        final_segments = [(s['start'], s['end'], s['conf']) for s in segments]
        
        # Sort by final confidence
        final_segments.sort(key=lambda x: x[2], reverse=True)
        return final_segments[:5]