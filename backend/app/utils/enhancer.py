import logging
from pathlib import Path
from typing import List, Tuple, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

Segment = Tuple[float, float, float]  # (start, end, confidence)

class LangchainHFEnhancer:
    """Enhanced version of the segment enhancer using Hugging Face models."""
    
    @staticmethod
    async def enhance_segments(video_path: Path, segments: List[Segment]) -> List[Segment]:
        """
        Enhance video segments using transcript data and text analysis.
        
        Args:
            video_path: Path to the video file
            segments: List of segments as (start_time, end_time, confidence)
            
        Returns:
            Enhanced list of segments with updated confidence scores
        """
        if not settings.USE_GPT:
            logger.info("LangChain Hugging Face enhancement skipped.")
            return segments
        
        # Import transcriber here to avoid circular imports
        from app.utils.transcriber import WhisperTranscriber
        from app.utils.analyzer import VideoAnalyzer
        
        logger.info(f"Enhancing {len(segments)} segments with HuggingFace text classification")
        
        # Get transcript for the video
        audio_path = await VideoAnalyzer.extract_audio(video_path)
        transcript_data = await WhisperTranscriber.transcribe_audio(audio_path)
        transcript_segments = transcript_data.get("segments", [])
        
        if not transcript_segments:
            logger.warning("No transcript segments found, returning original segments")
            return segments
            
        try:
            # Import and initialize the HuggingFace pipeline directly
            from transformers import pipeline
            
            # Use a text classification model - better for our use case
            classifier = pipeline(
                "text-classification", 
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device="cpu"  # Use CPU for compatibility
            )
            
            logger.info("Successfully initialized HuggingFace text classification pipeline")
            
        except Exception as e:
            logger.error(f"Failed to initialize HuggingFace pipeline: {e}")
            return segments
        
        enhanced_segments = []
        
        # Process each segment
        for idx, (start, end, confidence) in enumerate(segments):
            try:
                # Get relevant transcript text for this segment
                text_parts = [
                    seg.get("text", "")
                    for seg in transcript_segments
                    if start <= seg.get("end", 0) and end >= seg.get("start", 0)
                ]
                transcript_text = " ".join(text_parts).strip()
                
                if not transcript_text:
                    logger.debug(f"No transcript for segment {start:.2f}-{end:.2f}, keeping original confidence")
                    enhanced_segments.append((start, end, confidence))
                    continue
                
                # Use pipeline directly without LangChain
                try:
                    # Classify with HuggingFace - limit text length to prevent issues
                    if len(transcript_text) > 1000:
                        transcript_text = transcript_text[:1000]
                        
                    result = classifier(transcript_text)
                    
                    # Handle result - typically a list with one dict containing label and score
                    if result and isinstance(result, list) and len(result) > 0:
                        classification = result[0]
                        
                        # Get the score - if positive label, use the score directly
                        # If negative, invert (1-score) to get engagement score
                        score = classification.get("score", 0.5)
                        label = classification.get("label", "").lower()
                        
                        engagement_score = score if "positive" in label else 1.0 - score
                        
                        # Combine scores - weight original analysis more
                        enhanced_confidence = 0.7 * confidence + 0.3 * engagement_score
                        logger.debug(f"Segment {idx}: Original={confidence:.2f}, Text={engagement_score:.2f}, Combined={enhanced_confidence:.2f}")
                    else:
                        # If unexpected result format, keep original
                        logger.warning(f"Unexpected classification result format: {result}")
                        enhanced_confidence = confidence
                        
                    enhanced_segments.append((start, end, enhanced_confidence))
                    
                except Exception as e:
                    logger.warning(f"Failed to classify segment {idx} ({start:.2f}-{end:.2f}): {e}")
                    enhanced_segments.append((start, end, confidence))
                    
            except Exception as e:
                logger.warning(f"Error enhancing segment {idx}: {e}")
                enhanced_segments.append((start, end, confidence))
        
        if enhanced_segments:
            logger.info(f"Successfully enhanced {len(enhanced_segments)} segments")
        else:
            logger.warning("No segments were enhanced, returning original segments")
            return segments
            
        return enhanced_segments