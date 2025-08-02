"""
LinkedIn AI Service for Shortify Platform
Provides advanced LinkedIn profile optimization and content generation
"""

import os
import json
import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from groq import Groq
import logging

logger = logging.getLogger(__name__)

class ContentTone(Enum):
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    TECHNICAL = "technical"

class LinkedInService:
    """Main service class for LinkedIn AI operations"""
    
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama3-8b-8192"
    
    async def scrape_linkedin_profile(self, linkedin_url: str) -> Dict:
        """
        Scrape LinkedIn profile data using web scraping
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(linkedin_url, headers=headers) as response:
                    if response.status != 200:
                        raise Exception(f"Failed to fetch profile: HTTP {response.status}")
                    
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Extract profile data
                    profile_data = {}
                    
                    # Name extraction
                    name_selectors = [
                        'h1.text-heading-xlarge',
                        '.pv-text-details__left-panel h1',
                        '.top-card-layout__title'
                    ]
                    profile_data['name'] = self._extract_text_by_selectors(soup, name_selectors)
                    
                    # Headline extraction
                    headline_selectors = [
                        '.text-body-medium.break-words',
                        '.pv-text-details__left-panel .text-body-medium',
                        '.top-card-layout__headline'
                    ]
                    profile_data['headline'] = self._extract_text_by_selectors(soup, headline_selectors)
                    
                    # About section extraction
                    about_selectors = [
                        '.pv-about__summary-text',
                        '.core-section-container__content .break-words',
                        '[data-section="summary"] .break-words'
                    ]
                    profile_data['about'] = self._extract_text_by_selectors(soup, about_selectors)
                    
                    # Experience extraction (simplified)
                    experience_elements = soup.find_all(['div', 'section'], class_=re.compile(r'experience|position'))
                    experiences = []
                    for elem in experience_elements[:3]:  # Get first 3 experiences
                        text = elem.get_text(strip=True)
                        if len(text) > 20:  # Filter out noise
                            experiences.append(text)
                    
                    profile_data['experience'] = ' | '.join(experiences) if experiences else "No experience data found"
                    
                    # Skills extraction
                    skill_elements = soup.find_all(['span', 'div'], class_=re.compile(r'skill'))
                    skills = []
                    for elem in skill_elements:
                        skill_text = elem.get_text(strip=True)
                        if skill_text and len(skill_text) < 50 and skill_text not in skills:
                            skills.append(skill_text)
                    
                    profile_data['skills'] = skills[:10] if skills else ["No skills data found"]
                    
                    return profile_data
                    
        except Exception as e:
            logger.error(f"Profile scraping failed: {str(e)}")
            # Return empty profile data instead of static data
            return {
                "name": "Unable to extract",
                "headline": "Unable to extract", 
                "about": "Unable to extract",
                "experience": "Unable to extract",
                "skills": []
            }

# Add this helper method to the LinkedInService class:

    def _extract_text_by_selectors(self, soup, selectors):
        """Helper method to extract text using multiple CSS selectors"""
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                text = element.get_text(strip=True)
                if text and len(text) > 5:  # Ensure meaningful content
                    return text
        return "Unable to extract"
    
    def calculate_profile_score(self, profile_data: Dict) -> int:
        """Calculate profile completeness and quality score"""
        score = 0
        max_score = 100
        
        # Completeness scoring (60% of total)
        if profile_data.get('name'):
            score += 10
        if profile_data.get('headline'):
            score += 15
        if profile_data.get('about') and len(profile_data['about']) > 50:
            score += 20
        if profile_data.get('experience'):
            score += 10
        if profile_data.get('skills') and len(profile_data['skills']) >= 3:
            score += 5
        
        # Quality scoring (40% of total)
        headline = profile_data.get('headline', '')
        about = profile_data.get('about', '')
        
        # Headline quality
        if len(headline) > 50:
            score += 5
        if any(keyword in headline.lower() for keyword in ['expert', 'specialist', 'manager', 'director', 'lead']):
            score += 5
        
        # About section quality
        if len(about) > 200:
            score += 10
        if len(about.split()) > 100:
            score += 5
        
        # Keyword density
        professional_keywords = ['experience', 'skilled', 'passionate', 'results', 'team', 'leadership']
        keyword_count = sum(1 for keyword in professional_keywords if keyword in about.lower())
        score += min(keyword_count * 2, 10)
        
        return min(score, max_score)
    
    def analyze_profile_content(self, profile_data: Dict) -> Tuple[List[str], List[str]]:
        """Analyze profile for strengths and weaknesses"""
        strengths = []
        weaknesses = []
        
        # Analyze completeness
        if profile_data.get('headline') and len(profile_data['headline']) > 50:
            strengths.append("Professional headline with good length")
        else:
            weaknesses.append("Headline could be more descriptive and keyword-rich")
        
        if profile_data.get('about') and len(profile_data['about']) > 150:
            strengths.append("Comprehensive about section")
        else:
            weaknesses.append("About section needs more detail and personal touch")
        
        if profile_data.get('skills') and len(profile_data['skills']) >= 5:
            strengths.append("Good variety of listed skills")
        else:
            weaknesses.append("More skills should be added to showcase expertise")
        
        # Analyze content quality
        about_text = profile_data.get('about', '').lower()
        if any(word in about_text for word in ['achieved', 'led', 'improved', 'increased']):
            strengths.append("Uses action-oriented language")
        else:
            weaknesses.append("Could use more action verbs and quantifiable achievements")
        
        if any(word in about_text for word in ['passionate', 'dedicated', 'committed']):
            strengths.append("Shows enthusiasm and commitment")
        
        return strengths, weaknesses
    
    async def generate_ai_suggestions(self, profile_data: Dict, score: int) -> List[str]:
        """Generate AI-powered improvement suggestions"""
        try:
            context = f"""
            Profile Analysis:
            - Name: {profile_data.get('name', 'N/A')}
            - Headline: {profile_data.get('headline', 'N/A')}
            - About: {profile_data.get('about', 'N/A')[:200]}...
            - Score: {score}/100
            """
            
            prompt = f"""
            Based on this LinkedIn profile analysis, provide 5-7 specific, actionable improvement suggestions:
            
            {context}
            
            Focus on:
            1. Keyword optimization for better visibility
            2. Content structure and readability
            3. Professional branding and positioning
            4. Specific examples and quantifiable achievements
            5. Call-to-action and engagement opportunities
            
            Do not just copy the data provided try to create new related to it Make suggestions specific and actionable. Return as a JSON list of strings.
            """
            
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            try:
                suggestions = json.loads(content)
                if isinstance(suggestions, list):
                    return suggestions
            except json.JSONDecodeError:
                pass
            
            # Fallback suggestions
            return [
                "Add quantifiable achievements with specific numbers and percentages",
                "Include industry-relevant keywords in your headline and about section",
                "Use action verbs to describe your experience and accomplishments",
                "Add a clear call-to-action at the end of your about section",
                "Ensure your headline includes your target role and key skills",
                "Structure your about section with clear paragraphs and bullet points",
                "Include relevant certifications and continuous learning initiatives"
            ]
            
        except Exception as e:
            logger.error(f"AI suggestion generation failed: {str(e)}")
            raise Exception("Failed to generate AI suggestions")
    
    async def generate_headlines(self, skills: List[str], role: str, career_goal: str, tone: ContentTone) -> List[str]:
        """Generate LinkedIn headlines"""
        try:
            skills_text = ", ".join(skills[:5])  # Limit to top 5 skills
            
            tone_instructions = {
                ContentTone.PROFESSIONAL: "formal, corporate, achievement-focused",
                ContentTone.FRIENDLY: "approachable, warm, conversational",
                ContentTone.TECHNICAL: "expertise-focused, technical terms, innovation-oriented"
            }
            
            prompt = f"""
            Create 3 compelling LinkedIn headlines for a {role} professional.
            
            Skills: {skills_text}
            Career Goal: {career_goal}
            Tone: {tone_instructions[tone]}
            
            Requirements:
            - Maximum 120 characters each
            - Include role and key skills
            - Make them {tone.value} in tone
            - Include power words and keywords
            - Make them unique and memorable
            
            Do not just copy the data provided try to create new related to it, Return as JSON array of strings.
            """
            
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            
            try:
                headlines = json.loads(content)
                if isinstance(headlines, list) and len(headlines) >= 3:
                    return headlines[:3]
            except json.JSONDecodeError:
                pass
            
            # Fallback headlines
            return [
                f"{role} | {skills[0]} Expert | {career_goal.split()[0]} Focused",
                f"Passionate {role} Driving Innovation Through {skills[0]} & {skills[1] if len(skills) > 1 else 'Technology'}",
                f"{role} | Transforming Ideas into Impact | {career_goal}"
            ]
            
        except Exception as e:
            logger.error(f"Headline generation failed: {str(e)}")
            raise Exception("Failed to generate headlines")
    
    async def generate_about_sections(self, skills: List[str], role: str, career_goal: str, tone: ContentTone) -> List[str]:
        """Generate LinkedIn about sections"""
        try:
            skills_text = ", ".join(skills)
            
            tone_instructions = {
                ContentTone.PROFESSIONAL: "formal, results-driven, corporate language",
                ContentTone.FRIENDLY: "warm, personal, approachable storytelling",
                ContentTone.TECHNICAL: "technical expertise, innovation-focused, industry-specific terms"
            }
            
            prompt = f"""
            Create 2 compelling LinkedIn "About" sections for a {role} professional.
            
            Skills: {skills_text}
            Career Goal: {career_goal}
            Tone: {tone_instructions[tone]}
            
            Requirements:
            - 150-300 words each
            - {tone.value} tone throughout
            - Include skills naturally
            - Mention career goals
            - Add personality and unique value proposition
            - End with a call-to-action
            - Use paragraphs for readability
            
            Do not just copy the data provided try to create new related to it make it simple engaging and try to imclude latest tech,Return as JSON array of strings.
            """
            
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            
            try:
                about_sections = json.loads(content)
                if isinstance(about_sections, list) and len(about_sections) >= 2:
                    return about_sections[:2]
            except json.JSONDecodeError:
                pass
            
            # Fallback about sections
            return [
                f"As a dedicated {role}, I bring expertise in {skills_text} to drive meaningful results. My passion for {career_goal.lower()} has led me to develop innovative solutions and build strong professional relationships.\n\nI believe in continuous learning and staying ahead of industry trends. My experience spans various projects where I've successfully applied my skills to deliver exceptional outcomes.\n\nLet's connect if you're interested in discussing opportunities or sharing insights about the industry!",
                f"Experienced {role} with a strong foundation in {skills_text}. I'm committed to {career_goal.lower()} and helping organizations achieve their strategic objectives.\n\nThroughout my career, I've focused on delivering high-quality solutions that make a real impact. I enjoy collaborating with diverse teams and tackling complex challenges that push the boundaries of what's possible.\n\nI'm always open to connecting with like-minded professionals. Feel free to reach out if you'd like to discuss potential collaborations or industry insights!"
            ]
            
        except Exception as e:
            logger.error(f"About section generation failed: {str(e)}")
            raise Exception("Failed to generate about sections")
    
    async def generate_post_content(self, event_type: str, details: Optional[str] = None) -> Dict[str, any]:
        """Generate LinkedIn post content"""
        try:
            event_mapping = {
                "job_update": "new job opportunity or career milestone",
                "certification": "professional certification achievement",
                "project": "successful project completion",
                "general": "professional milestone or achievement"
            }
            
            event_description = event_mapping.get(event_type, "professional update")
            
            prompt = f"""
            Create a professional yet engaging LinkedIn post about a {event_description}.
            
            Additional Details: {details or 'Recent professional achievement'}
            
            Requirements:
            - 150-300 words
            - Professional but authentic tone
            - Include storytelling elements
            - Show gratitude and humility
            - Use line breaks for readability
            - Include 3-5 relevant hashtags
            - End with engaging call-to-action question
            
            Do not just copy the data provided try to create new related to it, Return as JSON with keys: content, hashtags, cta
            """
            
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            
            try:
                parsed_content = json.loads(content)
                return parsed_content
            except json.JSONDecodeError:
                pass
            
            # Fallback content
            return {
                "content": f"Excited to share my recent {event_description}! 🎉\n\nThis milestone represents months of dedication, continuous learning, and the support of an amazing network. The journey has been filled with challenges that pushed me to grow both professionally and personally.\n\nI'm grateful for the mentors, colleagues, and friends who believed in me and provided guidance along the way. Their insights and encouragement have been invaluable.\n\nLooking forward to applying these new skills and experiences to make an even greater impact in my field.",
                "hashtags": ["#ProfessionalGrowth", "#CareerMilestone", "#Grateful", "#ContinuousLearning", "#Achievement"],
                "cta": "What recent milestones are you celebrating? I'd love to hear about your journey in the comments! 👇"
            }
            
        except Exception as e:
            logger.error(f"Post generation failed: {str(e)}")
            raise Exception("Failed to generate post content")
    
    async def optimize_skills_for_role(self, current_skills: List[str], target_role: str) -> Dict[str, any]:
        """Optimize skills for a specific role"""
        try:
            current_skills_text = ", ".join(current_skills)
            
            prompt = f"""
            Analyze skills for a {target_role} position:
            
            Current Skills: {current_skills_text}
            Target Role: {target_role}
            
            Provide recommendations for:
            1. Top 5 skills to prioritize/add for this role
            2. Skills to emphasize from current list
            3. 3 professional endorsement request messages (50-100 words each)
            
            Return as JSON with keys: recommended_skills, priority_skills, endorsement_messages
            """
            
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5
            )
            
            content = response.choices[0].message.content
            
            try:
                parsed_content = json.loads(content)
                return parsed_content
            except json.JSONDecodeError:
                pass
            
            # Fallback recommendations
            return {
                "recommended_skills": ["Leadership", "Strategic Planning", "Data Analysis", "Project Management", "Communication"],
                "priority_skills": current_skills[:3],
                "endorsement_messages": [
                    "Hi! I hope you're doing well. I'd really appreciate if you could endorse my skills on LinkedIn based on our professional collaboration. Your endorsement would mean a lot to me and help showcase my expertise to potential opportunities. Thank you in advance!",
                    "Hello! I wanted to reach out and ask if you'd be willing to endorse my skills on LinkedIn. Having worked together, you've seen my capabilities firsthand, and your endorsement would be incredibly valuable. I'm happy to return the favor as well!",
                    "Hi there! I hope everything is going great with you. Would you mind taking a moment to endorse some of my skills on LinkedIn? Your professional validation would be tremendously helpful for my career growth. Thanks so much for considering it!"
                ]
            }
            
        except Exception as e:
            logger.error(f"Skill optimization failed: {str(e)}")
            raise Exception("Failed to optimize skills")
    
    async def generate_connection_messages(self, purpose: str, target_role: str, context: str, include_emoji: bool = True) -> List[str]:
        """Generate LinkedIn connection request messages"""
        try:
            emoji_instruction = "Include appropriate professional emojis" if include_emoji else "No emojis"
            
            prompt = f"""
            Create 3 LinkedIn connection request messages for {purpose}:
            
            Target Role: {target_role}
            Context/Relationship: {context}
            Purpose: {purpose}
            Style: Professional, personalized, {emoji_instruction}
            
            Requirements:
            - 200-300 characters each (LinkedIn limit)
            - Personalized and specific
            - Clear but not pushy
            - Professional tone
            - Mention common ground or specific interest
            
            Do not just copy the data provided try to create new related to it, Return as JSON array of strings.
            """
            
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            
            try:
                messages = json.loads(content)
                if isinstance(messages, list):
                    return messages
            except json.JSONDecodeError:
                pass
            
            # Fallback messages
            emoji = " 👋" if include_emoji else ""
            return [
                f"Hi{emoji} I noticed your experience in {target_role} and would love to connect. I'm particularly interested in {context} and would appreciate the opportunity to learn from your expertise.",
                f"Hello! Your background in {target_role} caught my attention. I'm passionate about {context} and would value connecting with someone who shares similar professional interests.",
                f"Hi there{emoji} I came across your profile and was impressed by your work in {target_role}. I'd love to connect and potentially exchange insights about {context}. Thanks for considering!"
            ]
            
        except Exception as e:
            logger.error(f"Connection message generation failed: {str(e)}")
            raise Exception("Failed to generate connection messages")
    
    async def analyze_job_match(self, job_description: str, profile_data: Dict) -> Dict[str, any]:
        """Analyze job fit and provide tailored recommendations"""
        try:
            skills_text = ", ".join(profile_data.get('skills', []))
            
            prompt = f"""
            Analyze job fit between this job and candidate:
            
            JOB DESCRIPTION:
            {job_description[:1000]}...
            
            CANDIDATE PROFILE:
            - Role: {profile_data.get('headline', 'N/A')}
            - Skills: {skills_text}
            - Experience: {profile_data.get('experience', 'N/A')[:200]}
            - About: {profile_data.get('about', 'N/A')[:200]}
            
            Provide:
            1. Match score (0-100) with reasoning
            2. Tailored headline for this specific job
            3. Tailored summary paragraph (150-200 words)
            4. 5 specific improvement tips
            5. Missing skills to highlight
            
            Return as JSON with keys: match_score, reasoning, tailored_headline, tailored_summary, improvement_tips, missing_skills
            """
            
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            try:
                analysis = json.loads(content)
                return analysis
            except json.JSONDecodeError:
                pass
            
            # Fallback analysis
            return {
                "match_score": 75,
                "reasoning": "Good alignment with required skills and experience level",
                "tailored_headline": f"{profile_data.get('name', 'Professional')} | Experienced {profile_data.get('headline', 'Candidate')} | Ready for New Challenges",
                "tailored_summary": "Experienced professional with a proven track record in delivering results. My background aligns well with the requirements of this role, bringing both technical skills and leadership experience. I'm passionate about contributing to team success and driving innovative solutions.",
                "improvement_tips": [
                    "Quantify achievements with specific metrics",
                    "Highlight relevant project outcomes",
                    "Emphasize leadership and collaboration skills",
                    "Add industry-specific keywords from job description",
                    "Include relevant certifications or training"
                ],
                "missing_skills": ["Project Management", "Data Analysis", "Strategic Planning"]
            }
            
        except Exception as e:
            logger.error(f"Job analysis failed: {str(e)}")
            raise Exception("Failed to analyze job match")