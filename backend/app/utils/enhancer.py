import logging
from pathlib import Path
from typing import List, Tuple
from app.core.config import settings
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_community.llms import HuggingFacePipeline
from transformers import pipeline

logger = logging.getLogger(__name__)

Segment = Tuple[float, float, float]  # (start, end, confidence)

class LangchainHFEnhancer:
    @staticmethod
    async def enhance_segments(video_path: Path, segments: List[Segment]) -> List[Segment]:
        if not settings.USE_GPT:
            logger.info("LangChain Hugging Face enhancement skipped.")
            return segments
        
        # Lazy import to avoid circular import issues
        from app.utils.transcriber import WhisperTranscriber
        transcript_data = await WhisperTranscriber.transcribe_video(video_path)
        transcript_segments = transcript_data.get("segments", [])

        # Initialize Hugging Face pipeline (sentiment-analysis as example)
        sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
        hf_llm = HuggingFacePipeline(pipeline=sentiment_pipeline)

        # LangChain prompt template (optional, can be simple)
        prompt_template = PromptTemplate(
            input_variables=["text"],
            template=(
                "Rate the emotional engagement of this transcript on a scale 0 to 1, "
                "where 1 is very engaging, and 0 is not engaging.\n\nTranscript: {text}\nScore:"
            )
        )

        chain = LLMChain(llm=hf_llm, prompt=prompt_template)

        enhanced_segments = []

        for (start, end, confidence) in segments:
            text_parts = [
                seg.get("text", "")
                for seg in transcript_segments
                if start <= seg.get("end", 0) and end >= seg.get("start", 0)
            ]
            transcript_text = " ".join(text_parts).strip()

            if not transcript_text:
                enhanced_segments.append((start, end, confidence))
                continue

            # Run LangChain to get score from Hugging Face model
            try:
                response = chain.run(text=transcript_text)
                # The response might be something like 'LABEL_1' or a string score, parse it
                # Here, we parse sentiment label or numeric value

                # Example handling: if response contains a float-like number
                try:
                    score = float(response.strip())
                except ValueError:
                    # fallback: map labels to scores manually
                    if "positive" in response.lower():
                        score = 1.0
                    elif "negative" in response.lower():
                        score = 0.0
                    else:
                        score = confidence  # fallback to original confidence

                combined_score = 0.6 * confidence + 0.4 * score
                enhanced_segments.append((start, end, combined_score))

            except Exception as e:
                logger.warning(f"LangChain HuggingFace scoring failed for segment {start}-{end}: {e}")
                enhanced_segments.append((start, end, confidence))

        return enhanced_segments
