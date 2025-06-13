import random
import time
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
import httpx
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
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

from requests_toolbelt import user_agent
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

# Enhanced LinkedIn Scraping Service
class LinkedInScraper:
    def __init__(self):
        self.api_key = os.getenv("PROXYCURL_API_KEY")
        self.base_url = "https://nubela.co/proxycurl/api/v2/linkedin"
        self.use_playwright_first = os.getenv("USE_PLAYWRIGHT_FIRST", "false").lower() == "true"
    
    def _get_rotating_headers(self):
        """Rotate headers to avoid detection"""
        headers_list = [
            {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
            },
            {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
            {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        ]
        return random.choice(headers_list)
    
    def _scrape_with_selenium(self, linkedin_url: str) -> dict:
        """Synchronous fallback using Selenium for Windows compatibility"""
        try:
            options = webdriver.ChromeOptions()
            options.add_argument("--headless")
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
            driver.get(linkedin_url)
            time.sleep(5)  # Let content load

            html = driver.page_source
            soup = BeautifulSoup(html, "html.parser")
            profile_data = self._extract_profile_data(soup)

            driver.quit()
            return profile_data
        except Exception as e:
            logger.error(f"Selenium scraping failed: {e}")
            return self._get_empty_profile()
    
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
    
    async def scrape_profile(self, linkedin_url: str) -> dict:
        """Scrape LinkedIn profile with multiple fallback methods"""
        profile_data = self._get_empty_profile()
        
        # Strategy 1: Try Selenium first if configured or if no Proxycurl API key
        if self.use_playwright_first or not self.api_key:
            logger.info("Using Selimium as primary scraping method")
            profile_data = self._scrape_with_selenium(linkedin_url)
            
            # If successful, return early
            if profile_data.get("name"):
                return profile_data
            
            # If Playwright failed but we have Proxycurl API key, try it as fallback
            if self.api_key:
                logger.info("Playwright failed, falling back to Proxycurl API")
                proxycurl_data = await self._scrape_with_selenium(linkedin_url)
                if proxycurl_data.get("name"):
                    return proxycurl_data
        
        # Strategy 2: Try Proxycurl first (original behavior)
        else:
            logger.info("Using Proxycurl API as primary scraping method")
            profile_data = self._scrape_with_selenium(linkedin_url)
            
            # If Proxycurl failed or returned empty name, try Playwright fallback
            if not profile_data.get("name"):
                logger.info("Proxycurl failed, trying fallback scraping method with Playwright...")
                playwright_data = self._scrape_with_selenium(linkedin_url)
                if playwright_data.get("name"):
                    return playwright_data
        
        # Return whatever we got (might be empty)
        return profile_data
    
    async def _scrape_with_proxycurl(self, linkedin_url: str) -> dict:
        """Original Proxycurl scraping method"""
        if not self.api_key:
            logger.warning("PROXYCURL_API_KEY not found")
            return self._get_empty_profile()
        
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        params = {
            "url": linkedin_url,
            "fallback_to_cache": "true",
            "use_cache": "if-present",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.base_url, headers=headers, params=params)
                
                logger.info(f"Proxycurl API response status: {response.status_code}")
                
                if response.status_code == 400:
                    logger.warning(f"Proxycurl API returned 400 for URL: {linkedin_url}")
                    return self._get_empty_profile()
                elif response.status_code == 401:
                    logger.error("Proxycurl API authentication failed - check API key")
                    return self._get_empty_profile()
                elif response.status_code == 429:
                    logger.warning("Proxycurl API rate limit exceeded")
                    return self._get_empty_profile()
                elif response.status_code != 200:
                    logger.warning(f"Proxycurl API returned {response.status_code}")
                    return self._get_empty_profile()
                
                response.raise_for_status()
                data = response.json()

                # Extract and clean the data
                profile_data = {
                    "name": self._clean_text(data.get("full_name")),
                    "headline": self._clean_text(data.get("headline")),
                    "about": self._clean_text(data.get("summary")),
                    "experience": self._extract_experience(data.get("experiences", [])),
                    "skills": self._extract_skills(data.get("skills", []))
                }
                
                logger.info(f"Successfully scraped profile with Proxycurl: {profile_data.get('name', 'Unknown')}")
                return profile_data
                
        except httpx.TimeoutException:
            logger.warning(f"Timeout scraping LinkedIn profile with Proxycurl: {linkedin_url}")
            return self._get_empty_profile()
        except httpx.HTTPError as e:
            logger.warning(f"HTTP error scraping LinkedIn profile with Proxycurl: {e}")
            return self._get_empty_profile()
        except Exception as e:
            logger.error(f"Unexpected error scraping LinkedIn profile with Proxycurl: {e}")
            return self._get_empty_profile()
    
    def _clean_text(self, text: str) -> str:
        """Clean and validate text data"""
        if not text:
            return ""
        
        # Remove excessive whitespace and clean up
        cleaned = re.sub(r'\s+', ' ', str(text).strip())
        return cleaned if len(cleaned) > 2 else ""
    
    def _extract_experience(self, experiences: List[Dict]) -> str:
        """Extract and format experience data"""
        if not experiences:
            return ""
        
        experience_texts = []
        for exp in experiences[:3]:  # Limit to first 3 experiences
            title = exp.get("title", "")
            company = exp.get("company", "")
            if title and company:
                experience_texts.append(f"{title} at {company}")
            elif title:
                experience_texts.append(title)
        
        return " | ".join(experience_texts)
    
    def _extract_skills(self, skills: List) -> List[str]:
        """Extract and clean skills data"""
        if not skills:
            return []
        
        cleaned_skills = []
        for skill in skills:
            if isinstance(skill, dict):
                skill_name = skill.get("name", "")
            else:
                skill_name = str(skill)
            
            skill_name = self._clean_text(skill_name)
            if skill_name and len(skill_name) < 50:
                cleaned_skills.append(skill_name)
        
        return cleaned_skills[:15]  # Limit to 15 skills
    
    def _get_empty_profile(self) -> Dict[str, Any]:
        """Return empty profile structure"""
        return {
            "name": "",
            "headline": "",
            "about": "",
            "experience": "",
            "skills": []
        }
    
    def _get_empty_profile_with_message(self, message: str) -> Dict[str, Any]:
        """Return empty profile with error message for debugging"""
        profile = self._get_empty_profile()
        profile["_error"] = message  # Internal error message for logging
        return profile
    
    def _extract_profile_data(self, soup) -> Dict[str, Any]:
        """Extract profile data from BeautifulSoup object with enhanced selectors"""
        profile_data = {}
        
        # Enhanced name extraction with more selectors
        name_selectors = [
            'h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words',
            'h1.text-heading-xlarge',
            '.pv-text-details__left-panel h1',
            '.top-card-layout__title',
            'h1[data-anonymize="person-name"]',
            '.pv-top-card--list h1',
            'h1.break-words',
            '.pv-top-card .pv-top-card__name',
            '.pv-top-card-v2-ctas .inline.t-24.v-align-middle.break-words',
            '[data-generated-suggestion-target="urn:li:member"] h1',
            '.top-card-layout__entity-info h1'
        ]
        name = self._extract_text_by_selectors(soup, name_selectors)
        profile_data['name'] = name if name else ""
        
        # Enhanced headline extraction
        headline_selectors = [
            '.text-body-medium.break-words',
            '.pv-text-details__left-panel .text-body-medium',
            '.top-card-layout__headline',
            '.pv-top-card--list .text-body-medium',
            '[data-anonymize="headline"]',
            '.pv-top-card-v2-ctas .text-body-medium',
            '.pv-top-card .pv-top-card__headline',
            '.top-card-layout__headline .break-words',
            '.pv-top-card-profile-picture + div .break-words'
        ]
        headline = self._extract_text_by_selectors(soup, headline_selectors)
        profile_data['headline'] = headline if headline else ""
        
        # Enhanced about section extraction
        about_selectors = [
            '.pv-about__summary-text .break-words',
            '.core-section-container__content .break-words',
            '[data-section="summary"] .break-words',
            '.pv-about-section .break-words',
            '.about-section .break-words',
            '.pv-about-section .pv-about__summary-text',
            '[data-section="aboutSection"] .break-words',
            '.artdeco-card .pv-about__summary-text'
        ]
        about = self._extract_text_by_selectors(soup, about_selectors)
        
        # If about is too short, try to get more text from the about section
        if not about or len(about) < 50:
            about_elements = soup.select('.pv-about__summary-text, .pv-about-section')
            for elem in about_elements:
                text = elem.get_text(strip=True)
                if text and len(text) > len(about or ""):
                    about = text
                    break
        
        profile_data['about'] = about if about else ""
        
        # Enhanced experience extraction
        experience_selectors = [
            '.pv-entity__summary-info',
            '.experience-section .pv-entity__summary-info',
            '.pv-profile-section__list-item',
            '[data-section="experience"] .break-words',
            '.pv-entity__summary-info-v2',
            '.experience-section .pv-entity__summary-info-v2'
        ]
        
        experiences = []
        # Try multiple approaches for experience extraction
        for selector in experience_selectors:
            elements = soup.select(selector)
            for elem in elements[:3]:  # Limit to first 3
                text = elem.get_text(strip=True)
                if text and len(text) > 20 and text not in experiences:
                    # Clean up the text
                    text = re.sub(r'\s+', ' ', text)
                    # Extract job title and company if possible
                    lines = text.split('\n')
                    if len(lines) >= 2:
                        title_company = f"{lines[0]} at {lines[1]}"
                        experiences.append(title_company[:200] + "..." if len(title_company) > 200 else title_company)
                    else:
                        experiences.append(text[:200] + "..." if len(text) > 200 else text)
        
        profile_data['experience'] = ' | '.join(experiences) if experiences else ""
        
        # Enhanced skills extraction
        skill_selectors = [
            '.pv-skill-category-entity__name-text',
            '.skill-category-entity__name',
            '[data-section="skills"] .break-words',
            '.pv-skill-category-list .break-words',
            '.pv-skill-category-entity__name',
            '.skills-section .pv-skill-category-entity__name-text'
        ]
        
        skills = set()  # Use set to avoid duplicates
        for selector in skill_selectors:
            elements = soup.select(selector)
            for elem in elements:
                skill_text = elem.get_text(strip=True)
                if skill_text and len(skill_text) < 50 and len(skill_text) > 2:
                    # Clean skill text
                    skill_text = re.sub(r'[^\w\s+#.-]', '', skill_text)
                    if skill_text and not skill_text.isdigit():  # Avoid numbers
                        skills.add(skill_text)
        
        profile_data['skills'] = list(skills)[:15] if skills else []
        
        # Log extraction results
        logger.info(f"Extracted profile data: name={bool(profile_data['name'])}, "
                   f"headline={bool(profile_data['headline'])}, "
                   f"about={len(profile_data['about'])}, "
                   f"experience={len(profile_data['experience'])}, "
                   f"skills={len(profile_data['skills'])}")
        
        return profile_data

# Initialize the scraper
linkedin_scraper = LinkedInScraper()

# Request Models (keeping existing ones)
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
        # Check if LinkedIn URL is provided
        if self.linkedin_url:
            return self  # URL is sufficient, we'll try to scrape
        
        # Check if any manual data is provided
        has_name = self.name and self.name.strip()
        has_headline = self.headline and self.headline.strip()
        has_about = self.about and self.about.strip()
        has_experience = self.experience and self.experience.strip()
        has_skills = self.skills and len(self.skills) > 0 and any(skill.strip() for skill in self.skills)
        
        if not any([has_name, has_headline, has_about, has_experience, has_skills]):
            raise ValueError('Either provide a LinkedIn URL or enter profile information manually.')
        
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

# Response Models (keeping existing ones)
class ProfileScore(BaseModel):
    score: int
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]

class GeneratedContent(BaseModel):
    headlines: List[str]
    about_sections: List[str]
    posts: List[str]

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

# AI Service Functions (keeping existing implementations)
async def analyze_profile_with_ai(profile_data: Dict[str, Any]) -> ProfileScore:
    """Analyze LinkedIn profile using Groq AI"""
    try:
        # Check if we have any meaningful data
        has_meaningful_data = any([
            profile_data.get('name', '').strip(),
            profile_data.get('headline', '').strip(),
            profile_data.get('about', '').strip(),
            profile_data.get('experience', '').strip(),
            profile_data.get('skills', [])
        ])
        
        if not has_meaningful_data:
            return ProfileScore(
                score=0,
                strengths=["Ready to build your LinkedIn presence"],
                weaknesses=[
                    "No profile data available for analysis",
                    "LinkedIn URL may be private or inaccessible",
                    "Profile information needs to be provided manually"
                ],
                suggestions=[
                    "Try entering your profile information manually below",
                    "Ensure your LinkedIn profile is set to public",
                    "Check if your LinkedIn URL is correct and accessible",
                    "Copy and paste your LinkedIn sections directly into the form",
                    "Start by adding a compelling headline and about section"
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
    if profile_data.get('name', '').strip():
        score += 10
    
    # Headline (20 points)
    headline = profile_data.get('headline', '').strip()
    if headline:
        score += 15
        if len(headline) > 50:
            score += 5
    
    # About section (30 points)
    about = profile_data.get('about', '').strip()
    if about:
        score += 20
        if len(about) > 200:
            score += 10
    
    # Experience (20 points)
    experience = profile_data.get('experience', '').strip()
    if experience:
        score += 15
        if len(experience) > 100:
            score += 5
    
    # Skills (20 points)
    skills = profile_data.get('skills', [])
    if skills:
        score += 10
        if len(skills) >= 5:
            score += 10
    
    return min(score, 100)

def analyze_profile_strengths_weaknesses(profile_data: Dict[str, Any]) -> tuple:
    """Analyze profile strengths and weaknesses"""
    strengths = []
    weaknesses = []
    
    # Check headline
    headline = profile_data.get('headline', '').strip()
    if headline:
        if len(headline) > 50:
            strengths.append("Comprehensive headline with good length")
        if any(word in headline.lower() for word in ['expert', 'specialist', 'manager', 'lead', 'senior']):
            strengths.append("Professional title included in headline")
    else:
        weaknesses.append("Headline needs improvement or is missing")
    
    # Check about section
    about = profile_data.get('about', '').strip()
    if about:
        if len(about) > 150:
            strengths.append("Detailed about section")
        if any(word in about.lower() for word in ['achieved', 'led', 'improved', 'increased']):
            strengths.append("Uses action-oriented language")
    else:
        weaknesses.append("About section needs development")
    
    # Check skills
    skills = profile_data.get('skills', [])
    if skills and len(skills) >= 5:
        strengths.append("Good variety of skills listed")
    else:
        weaknesses.append("More relevant skills should be added")
    
    # Check experience
    experience = profile_data.get('experience', '').strip()
    if experience:
        strengths.append("Professional experience is documented")
    else:
        weaknesses.append("Experience section needs more detail")
    
    # Default items if lists are empty
    if not strengths:
        strengths = ["Profile shows potential for professional growth"]
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
    
    headline = profile_data.get('headline', '').strip()
    if not headline or len(headline) < 50:
        suggestions.append("Create a compelling headline that includes your role, key skills, and value proposition")
    
    about = profile_data.get('about', '').strip()
    if not about or len(about) < 150:
        suggestions.append("Write a comprehensive about section that tells your professional story")
    
    skills = profile_data.get('skills', [])
    if not skills or len(skills) < 5:
        suggestions.append("Add at least 10 relevant skills to improve discoverability")
    
    # Add general suggestions
    suggestions.extend([
        "Use industry-specific keywords throughout your profile",
        "Include a professional call-to-action in your about section",
        "Add quantifiable achievements and impact metrics"
    ])
    
    return suggestions[:7]  # Limit to 7 suggestions

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
        3. 3 LinkedIn posts (1500 chars max each)
        
        Make them {request.tone.value}, engaging, and keyword-rich.
        Format as JSON with keys: headlines, about_sections, posts
        """
        
        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        
        # Try to parse JSON response
        import json
        try:
            parsed = json.loads(content)
            # Ensure all required fields exist
            if not all(key in parsed for key in ['headlines', 'about_sections', 'posts']):
                raise ValueError("Missing required fields")
            return GeneratedContent(**parsed)
        except (json.JSONDecodeError, ValueError):
            # Fallback content with ALL required fields
            return GeneratedContent(
                headlines=[
                    f"{request.role} | {request.skills[0]} Expert | {request.career_goal}",
                    f"Passionate {request.role} driving innovation through {request.skills[0]}",
                    f"{request.role} | Transforming ideas into impact"
                ],
                about_sections=[
                    f"As a dedicated {request.role}, I specialize in {skills_str}. My goal is {request.career_goal}.",
                    f"Experienced {request.role} with expertise in {skills_str}. I'm passionate about {request.career_goal}."
                ],
                posts=[
                    f"🚀 Excited to share my journey as a {request.role} specializing in {skills_str}! Currently focused on {request.career_goal}. #TechCareer #WebDevelopment",
                    f"💡 Just completed another project using {request.skills[0]}! The key to success in {request.career_goal} is continuous learning and hands-on practice. What's your favorite tech stack? #Coding #TechSkills",
                    f"🎯 Looking ahead: My goal is to excel in {request.career_goal}. With skills in {skills_str}, I'm ready to take on new challenges and contribute to innovative projects! #CareerGoals #TechJourney"
                ]
            )
            
    except Exception as e:
        print(f"Error generating content: {str(e)}")
        print(f"Raw AI response: {content}")
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

# API Endpoints
@router.post("/analyze-profile", response_model=ProfileScore)
async def analyze_profile(request: ProfileAnalysisRequest):
    """Analyze LinkedIn profile with improved error handling"""
    
    try:
        profile_data = {}
        
        # If LinkedIn URL is provided, try to scrape the profile
        if request.linkedin_url:
            logger.info(f"Attempting to scrape LinkedIn profile: {request.linkedin_url}")
            scraped_data = await linkedin_scraper.scrape_profile(str(request.linkedin_url))
            
            # Use scraped data as base
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
            # Use manually provided data only
            profile_data = {
                "name": request.name or "",
                "headline": request.headline or "",
                "about": request.about or "",
                "experience": request.experience or "",
                "skills": request.skills or []
            }
        
        logger.info(f"Analyzing profile data for: {profile_data.get('name', 'Unknown')}")
        return await analyze_profile_with_ai(profile_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/generate-content", response_model=GeneratedContent)
async def generate_headlines_and_bio(
    request: HeadlineBioRequest,
    #current_user: User = Depends(get_current_user)
):
    """Generate LinkedIn headlines and bio sections"""
    return await generate_headlines_bio(request)

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "service": "linkwise-ai", 
        "scraping": "enabled",
        "proxycurl_configured": bool(os.getenv("PROXYCURL_API_KEY")),
        "groq_configured": bool(os.getenv("GROQ_API_KEY"))
    }