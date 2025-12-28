from fastapi import HTTPException
import os
import logging
from io import BytesIO

# Document processing imports
import PyPDF2
from docx import Document

# LangChain and Groq imports
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY environment variable not set")
    raise ValueError("GROQ_API_KEY environment variable must be set")

llm = ChatGroq(
    temperature=0.7,
    groq_api_key=GROQ_API_KEY,
    model_name="llama-3.1-8b-instant"  
)

# Document processing functions
def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_file = BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to extract text from PDF")

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc_file = BytesIO(file_content)
        doc = Document(doc_file)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to extract text from DOCX")

def extract_text_from_doc(file_content: bytes) -> str:
    """Extract text from DOC file using python-docx (limited support)"""
    try:
        # For .doc files, we'll try to handle them as .docx
        # In production, you might want to use python-docx2txt or antiword
        return extract_text_from_docx(file_content)
    except Exception as e:
        logger.error(f"Error extracting text from DOC: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to extract text from DOC file. Please convert to DOCX or PDF.")

def extract_text_from_txt(file_content: bytes) -> str:
    """Extract text from TXT file"""
    try:
        return file_content.decode('utf-8')
    except UnicodeDecodeError:
        try:
            return file_content.decode('latin-1')
        except Exception as e:
            logger.error(f"Error extracting text from TXT: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to extract text from TXT file")

# Cover letter generation prompt template
COVER_LETTER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert cover letter writer with years of experience in recruitment and career counseling. 
    Your task is to create compelling, personalized cover letters that effectively match candidate qualifications with job requirements.

    Guidelines:
    1. Create a professional, engaging cover letter that highlights relevant skills and experiences
    2. Match the candidate's background to the specific job requirements
    3. Use the specified tone while maintaining professionalism
    4. Structure: Opening paragraph (interest + brief intro), body paragraphs (relevant experience/skills), closing paragraph (call to action)
    5. Keep it concise (1-2 paragraphs, ~100-200 words)
    6. Avoid generic statements; be specific and tailored
    7. Show enthusiasm for the role and company
    8. Include specific examples from the resume when relevant
    
    Tone guidelines:
    - Professional: Formal, respectful, business-like language
    - Friendly: Warm yet professional, approachable tone
    - Enthusiastic: Energetic, excited, passionate language
    - Confident: Assertive, self-assured, direct statements
    - Casual: Relaxed but respectful, conversational tone"""),
    
    ("human", """Please write a cover letter for the following:

    Company: {company}
    Position: {role}
    Tone: {tone}

    Candidate's Resume/Background:
    {resume}

    Job Description:
    {job_description}

    Please create a tailored cover letter that effectively connects the candidate's background with this specific opportunity.""")
])
