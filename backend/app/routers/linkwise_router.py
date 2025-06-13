from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, HttpUrl, field_validator, model_validator, validator
from typing import Optional, List, Dict, Any
from enum import Enum
import re
import asyncio
from groq import Groq
import os
import aiohttp
from bs4 import BeautifulSoup
import logging
from ..core.config import settings
from ..auth.dependencies import get_current_user
from ..models.user import User

router = APIRouter(prefix="/linkwise", tags=["linkwise"])

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

logger = logging.getLogger(__name__)

class ToneType(str, Enum):
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    TECHNICAL = "technical"

class EventType(str, Enum):
    JOB_UPDATE = "job_update"
    CERTIFICATION = "certification"
    PROJECT = "project"
    GENERAL = "general"

class PurposeType(str, Enum):
    JOB = "job"
    MENTORSHIP = "mentorship"
    NETWORKING = "networking"

# LinkedIn Scraping Service
class LinkedInScraper:
    """Service for scraping LinkedIn profiles"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
    
    def _extract_text_by_selectors(self, soup, selectors):
        """Helper method to extract text using multiple CSS selectors"""
        for selector in selectors:
            try:
                element = soup.select_one(selector)
                if element:
                    text = element.get_text(strip=True)
                    if text and len(text) > 5:  # Ensure meaningful content
                        return text
            except Exception as e:
                logger.debug(f"Selector {selector} failed: {e}")
                continue
        return None
    
    async def scrape_profile(self, linkedin_url: str) -> Dict[str, Any]:
        """Scrape LinkedIn profile data"""
        try:
            # Clean the URL
            clean_url = str(linkedin_url).rstrip('/')
            if not clean_url.startswith('https://www.linkedin.com/in/'):
                raise ValueError("Invalid LinkedIn profile URL format")
            
            timeout = aiohttp.ClientTimeout(total=30)
            
            async with aiohttp.ClientSession(timeout=timeout, headers=self.headers) as session:
                try:
                    async with session.get(clean_url) as response:
                        if response.status == 999:
                            logger.warning("LinkedIn returned 999 status (likely bot detection)")
                            return self._get_fallback_profile()
                        
                        if response.status != 200:
                            logger.error(f"HTTP {response.status} when fetching {clean_url}")
                            return self._get_fallback_profile()
                        
                        html = await response.text()
                        
                        if "authwall" in html.lower() or "sign in" in html.lower():
                            logger.warning("LinkedIn auth wall detected")
                            return self._get_fallback_profile()
                        
                        soup = BeautifulSoup(html, 'html.parser')
                        return self._extract_profile_data(soup)
                        
                except asyncio.TimeoutError:
                    logger.error("Timeout when scraping LinkedIn profile")
                    return self._get_fallback_profile()
                except Exception as e:
                    logger.error(f"Error during scraping: {e}")
                    return self._get_fallback_profile()
                    
        except Exception as e:
            logger.error(f"Profile scraping failed: {str(e)}")
            return self._get_fallback_profile()
    
    def _extract_profile_data(self, soup) -> Dict[str, Any]:
        """Extract profile data from BeautifulSoup object"""
        profile_data = {}
        
        # Name extraction - multiple selectors
        name_selectors = [
            'h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words',
            'h1.text-heading-xlarge',
            '.pv-text-details__left-panel h1',
            '.top-card-layout__title',
            'h1[data-anonymize="person-name"]',
            '.pv-top-card--list h1',
            'h1.break-words'
        ]
        name = self._extract_text_by_selectors(soup, name_selectors)
        profile_data['name'] = name if name else "Name not available"
        
        # Headline extraction
        headline_selectors = [
            '.text-body-medium.break-words',
            '.pv-text-details__left-panel .text-body-medium',
            '.top-card-layout__headline',
            '.pv-top-card--list .text-body-medium',
            '[data-anonymize="headline"]',
            '.pv-top-card-v2-ctas .text-body-medium'
        ]
        headline = self._extract_text_by_selectors(soup, headline_selectors)
        profile_data['headline'] = headline if headline else "Headline not available"
        
        # About section extraction
        about_selectors = [
            '.pv-about__summary-text .break-words',
            '.core-section-container__content .break-words',
            '[data-section="summary"] .break-words',
            '.pv-about-section .break-words',
            '.about-section .break-words'
        ]
        about = self._extract_text_by_selectors(soup, about_selectors)
        profile_data['about'] = about if about else "About section not available"
        
        # Experience extraction
        experience_selectors = [
            '.pv-entity__summary-info',
            '.experience-section .pv-entity__summary-info',
            '.pv-profile-section__list-item',
            '[data-section="experience"] .break-words'
        ]
        
        experiences = []
        for selector in experience_selectors:
            elements = soup.select(selector)
            for elem in elements[:3]:  # Limit to first 3
                text = elem.get_text(strip=True)
                if text and len(text) > 20 and text not in experiences:
                    # Clean up the text
                    text = re.sub(r'\s+', ' ', text)
                    experiences.append(text[:200] + "..." if len(text) > 200 else text)
        
        profile_data['experience'] = ' | '.join(experiences) if experiences else "Experience not available"
        
        # Skills extraction
        skill_selectors = [
            '.pv-skill-category-entity__name-text',
            '.skill-category-entity__name',
            '[data-section="skills"] .break-words',
            '.pv-skill-category-list .break-words'
        ]
        
        skills = set()  # Use set to avoid duplicates
        for selector in skill_selectors:
            elements = soup.select(selector)
            for elem in elements:
                skill_text = elem.get_text(strip=True)
                if skill_text and len(skill_text) < 50 and len(skill_text) > 2:
                    # Clean skill text
                    skill_text = re.sub(r'[^\w\s+#.-]', '', skill_text)
                    if skill_text:
                        skills.add(skill_text)
        
        profile_data['skills'] = list(skills)[:15] if skills else ["Skills not available"]
        
        # Log what we extracted
        logger.info(f"Extracted profile data: name={bool(profile_data['name'])}, "
                   f"headline={bool(profile_data['headline'])}, "
                   f"about={len(profile_data['about'])}, "
                   f"experience={len(profile_data['experience'])}, "
                   f"skills={len(profile_data['skills'])}")
        
        return profile_data
    
    def _get_fallback_profile(self) -> Dict[str, Any]:
        """Return fallback profile when scraping fails"""
        return {
            "name": "Profile data unavailable",
            "headline": "Unable to extract headline due to LinkedIn restrictions",
            "about": "LinkedIn has restrictions that prevent automated data extraction. Please manually enter your profile information for analysis.",
            "experience": "Experience data unavailable due to access restrictions",
            "skills": ["Unable to extract skills"]
        }

# Initialize the scraper
linkedin_scraper = LinkedInScraper()

# Request Models
class ProfileAnalysisRequest(BaseModel):
    linkedin_url: Optional[HttpUrl] = None
    name: Optional[str] = None
    headline: Optional[str] = None
    about: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[List[str]] = None

    @model_validator(mode='after')
    def validate_at_least_one_field(self):
        """Ensure at least one field is provided"""
        has_linkedin_url = self.linkedin_url is not None
        has_name = self.name is not None and self.name.strip() != ""
        has_headline = self.headline is not None and self.headline.strip() != ""
        has_about = self.about is not None and self.about.strip() != ""
        has_experience = self.experience is not None and self.experience.strip() != ""
        has_skills = self.skills is not None and len(self.skills) > 0 and any(skill.strip() for skill in self.skills)
        
        if not any([has_linkedin_url, has_name, has_headline, has_about, has_experience, has_skills]):
            raise ValueError('At least one field with meaningful data must be provided.')
        
        return self

class HeadlineBioRequest(BaseModel):
    skills: List[str]
    role: str
    career_goal: str
    tone: ToneType = ToneType.PROFESSIONAL

class PostGeneratorRequest(BaseModel):
    event_type: EventType
    details: Optional[str] = None

class SkillOptimizerRequest(BaseModel):
    current_skills: List[str]
    target_role: str

class DMGeneratorRequest(BaseModel):
    purpose: PurposeType
    target_role: str
    relationship_context: str
    include_emoji: bool = True

class JobMatchRequest(BaseModel):
    job_url: Optional[HttpUrl] = None
    job_description: Optional[str] = None
    user_profile: ProfileAnalysisRequest

# Response Models
class ProfileScore(BaseModel):
    score: int
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]

class GeneratedContent(BaseModel):
    headlines: List[str]
    about_sections: List[str]

class PostContent(BaseModel):
    content: str
    hashtags: List[str]
    cta: str

class SkillRecommendation(BaseModel):
    recommended_skills: List[str]
    endorsement_messages: List[str]

class DMTemplate(BaseModel):
    messages: List[str]

class JobMatch(BaseModel):
    match_score: int
    tailored_headline: str
    tailored_summary: str
    improvement_tips: List[str]

# AI Service Functions
async def analyze_profile_with_ai(profile_data: Dict[str, Any]) -> ProfileScore:
    """Analyze LinkedIn profile using Groq AI"""
    try:
        # Check if this is scraped data that failed
        if (profile_data.get('name') == "Profile data unavailable" or 
            "unavailable" in str(profile_data.get('about', '')).lower()):
            
            return ProfileScore(
                score=0,
                strengths=["Profile URL provided"],
                weaknesses=[
                    "Unable to access LinkedIn profile data",
                    "LinkedIn has anti-scraping measures in place",
                    "Profile may be private or restricted"
                ],
                suggestions=[
                    "Try manually entering your profile information",
                    "Ensure your LinkedIn profile is set to public",
                    "Check if your profile URL is correct",
                    "Consider copying and pasting your profile sections directly",
                    "LinkedIn's privacy settings may be blocking automated access"
                ]
            )
        
        prompt = f"""
        Analyze this LinkedIn profile and provide a comprehensive professional assessment:
        
        Profile Information:
        - Name: {profile_data.get('name', 'Not provided')}
        - Headline: {profile_data.get('headline', 'Not provided')}
        - About Section: {profile_data.get('about', 'Not provided')[:500]}
        - Experience: {profile_data.get('experience', 'Not provided')[:300]}
        - Skills: {', '.join(profile_data.get('skills', [])[:10])}
        
        Please provide a detailed analysis with:
        1. Professional score (0-100) based on profile completeness, keyword optimization, and professional impact
        2. 3-5 key strengths (what's working well)
        3. 3-5 specific weaknesses or areas for improvement
        4. 5-7 actionable suggestions for improvement
        
        Focus on:
        - Content quality and professional presentation
        - Keyword optimization for visibility
        - Call-to-action and engagement opportunities
        - Industry relevance and positioning
        - Quantifiable achievements and impact
        
        Respond in valid JSON format with keys: score, strengths, weaknesses, suggestions
        """
        
        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1500
        )
        
        content = response.choices[0].message.content.strip()
        
        # Try to parse JSON response
        import json
        try:
            # Clean the response if it has markdown formatting
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
            
            parsed = json.loads(content)
            
            # Validate the structure
            if all(key in parsed for key in ['score', 'strengths', 'weaknesses', 'suggestions']):
                return ProfileScore(**parsed)
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning(f"Failed to parse AI response as JSON: {e}")
        
        # Fallback analysis based on profile data
        score = calculate_profile_score(profile_data)
        strengths, weaknesses = analyze_profile_strengths_weaknesses(profile_data)
        suggestions = generate_improvement_suggestions(profile_data, score)
        
        return ProfileScore(
            score=score,
            strengths=strengths,
            weaknesses=weaknesses,
            suggestions=suggestions
        )
        
    except Exception as e:
        logger.error(f"AI analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile analysis failed: {str(e)}")

def calculate_profile_score(profile_data: Dict[str, Any]) -> int:
    """Calculate profile completeness score"""
    score = 0
    
    # Name (10 points)
    if profile_data.get('name') and profile_data['name'] != "Profile data unavailable":
        score += 10
    
    # Headline (20 points)
    headline = profile_data.get('headline', '')
    if headline and "unavailable" not in headline.lower():
        score += 15
        if len(headline) > 50:
            score += 5
    
    # About section (30 points)
    about = profile_data.get('about', '')
    if about and "unavailable" not in about.lower():
        score += 20
        if len(about) > 200:
            score += 10
    
    # Experience (20 points)
    experience = profile_data.get('experience', '')
    if experience and "unavailable" not in experience.lower():
        score += 15
        if len(experience) > 100:
            score += 5
    
    # Skills (20 points)
    skills = profile_data.get('skills', [])
    if skills and skills[0] != "Unable to extract skills":
        score += 10
        if len(skills) >= 5:
            score += 10
    
    return min(score, 100)

def analyze_profile_strengths_weaknesses(profile_data: Dict[str, Any]) -> tuple:
    """Analyze profile strengths and weaknesses"""
    strengths = []
    weaknesses = []
    
    # Check headline
    headline = profile_data.get('headline', '')
    if headline and "unavailable" not in headline.lower():
        if len(headline) > 50:
            strengths.append("Comprehensive headline with good length")
        if any(word in headline.lower() for word in ['expert', 'specialist', 'manager', 'lead', 'senior']):
            strengths.append("Professional title included in headline")
    else:
        weaknesses.append("Headline needs improvement or is missing")
    
    # Check about section
    about = profile_data.get('about', '')
    if about and "unavailable" not in about.lower():
        if len(about) > 150:
            strengths.append("Detailed about section")
        if any(word in about.lower() for word in ['achieved', 'led', 'improved', 'increased']):
            strengths.append("Uses action-oriented language")
    else:
        weaknesses.append("About section needs development")
    
    # Check skills
    skills = profile_data.get('skills', [])
    if skills and skills[0] != "Unable to extract skills":
        if len(skills) >= 5:
            strengths.append("Good variety of skills listed")
    else:
        weaknesses.append("More relevant skills should be added")
    
    # Default items if lists are empty
    if not strengths:
        strengths = ["Profile shows professional presence"]
    if not weaknesses:
        weaknesses = ["Profile could benefit from optimization"]
    
    return strengths, weaknesses

def generate_improvement_suggestions(profile_data: Dict[str, Any], score: int) -> List[str]:
    """Generate specific improvement suggestions"""
    suggestions = []
    
    if score < 70:
        suggestions.extend([
            "Complete all basic profile sections (headline, about, experience)",
            "Add more relevant skills to showcase expertise",
            "Include quantifiable achievements in your descriptions"
        ])
    
    headline = profile_data.get('headline', '')
    if not headline or "unavailable" in headline.lower() or len(headline) < 50:
        suggestions.append("Create a compelling headline that includes your role, key skills, and value proposition")
    
    about = profile_data.get('about', '')
    if not about or "unavailable" in about.lower() or len(about) < 150:
        suggestions.append("Write a comprehensive about section that tells your professional story")
    
    skills = profile_data.get('skills', [])
    if not skills or len(skills) < 5:
        suggestions.append("Add at least 10 relevant skills to improve discoverability")
    
    # Add general suggestions
    suggestions.extend([
        "Use industry-specific keywords throughout your profile",
        "Include a professional call-to-action in your about section",
        "Add media, links, or examples of your work where possible"
    ])
    
    return suggestions[:7]  # Limit to 7 suggestions

# Rest of the functions remain the same...
async def generate_headlines_bio(request: HeadlineBioRequest) -> GeneratedContent:
    """Generate LinkedIn headlines and bio sections"""
    try:
        skills_str = ", ".join(request.skills)
        
        prompt = f"""
        Create LinkedIn content for a {request.role} professional:
        
        Skills: {skills_str}
        Career Goal: {request.career_goal}
        Tone: {request.tone.value}
        
        Generate:
        1. 3 compelling LinkedIn headlines (120 chars max each)
        2. 2 "About" sections (2000 chars max each)
        
        Make them {request.tone.value}, engaging, and keyword-rich.
        Format as JSON with keys: headlines, about_sections
        """
        
        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        import json
        try:
            parsed = json.loads(content)
            return GeneratedContent(**parsed)
        except:
            # Fallback content
            return GeneratedContent(
                headlines=[
                    f"{request.role} | {request.skills[0]} Expert | {request.career_goal}",
                    f"Passionate {request.role} driving innovation through {request.skills[0]}",
                    f"{request.role} | Transforming ideas into impact"
                ],
                about_sections=[
                    f"As a dedicated {request.role}, I specialize in {skills_str}. My goal is {request.career_goal}.",
                    f"Experienced {request.role} with expertise in {skills_str}. I'm passionate about {request.career_goal}."
                ]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

# Include all the other existing functions here (generate_post_content, optimize_skills, etc.)
# They remain unchanged from your original code

# API Endpoints
@router.post("/analyze-profile", response_model=ProfileScore)
async def analyze_profile(request: ProfileAnalysisRequest):
    """Analyze LinkedIn profile with improved URL scraping"""
    
    try:
        profile_data = {}
        
        # If LinkedIn URL is provided, scrape the profile
        if request.linkedin_url:
            logger.info(f"Scraping LinkedIn profile: {request.linkedin_url}")
            scraped_data = await linkedin_scraper.scrape_profile(request.linkedin_url)
            profile_data.update(scraped_data)
            
            # Override with manually provided data if available
            if request.name:
                profile_data['name'] = request.name
            if request.headline:
                profile_data['headline'] = request.headline
            if request.about:
                profile_data['about'] = request.about
            if request.experience:
                profile_data['experience'] = request.experience
            if request.skills:
                profile_data['skills'] = request.skills
        
        else:
            # Use manually provided data
            profile_data = {
                "name": request.name or "Not provided",
                "headline": request.headline or "Not provided",
                "about": request.about or "Not provided",
                "experience": request.experience or "Not provided",
                "skills": request.skills or []
            }
        
        # Validate that we have some meaningful data
        if all(value in [None, "", "Not provided", [], ["Unable to extract skills"]] 
               for value in profile_data.values()):
            raise HTTPException(
                status_code=400, 
                detail="No meaningful profile data could be extracted or provided"
            )
        
        logger.info(f"Analyzing profile data: {list(profile_data.keys())}")
        return await analyze_profile_with_ai(profile_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Keep all other existing endpoints unchanged
@router.post("/generate-content", response_model=GeneratedContent)
async def generate_headlines_and_bio(
    request: HeadlineBioRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate LinkedIn headlines and bio sections"""
    return await generate_headlines_bio(request)

# ... (include all other existing endpoints)

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "linkwise-ai", "scraping": "enabled"}