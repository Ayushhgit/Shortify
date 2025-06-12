import xml.etree.ElementTree as ET
import requests
import time
import logging
from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Optional, Type

logger = logging.getLogger(__name__)

class ArxivInput(BaseModel):
    query: str = Field(..., description="Academic or research topic to search for in arXiv")

class ArxivTool(BaseTool):
    name: str = "arxiv_tool"
    description: str = "Useful for finding academic research papers on technical topics like machine learning, AI, transformers, attention mechanisms, and other scientific subjects using arXiv."
    args_schema: Type[BaseModel] = ArxivInput

    def _search_arxiv(self, query: str) -> str:
        cleaned_query = query.strip().replace(' ', '+')
        url = f"https://export.arxiv.org/api/query?search_query=ti:{cleaned_query}+OR+abs:{cleaned_query}&start=0&max_results=3&sortBy=relevance&sortOrder=descending"
        
        headers = {
            "User-Agent": "ShortifyBot/1.0 (localhost; contact: shortify.rpx@gmail.com)"
        }


        retries = 3
        response = None

        for attempt in range(retries):
            try:
                logger.info(f"ArXiv search attempt {attempt + 1} for query: {query}")
                response = requests.get(url, headers=headers, timeout=15)
                response.raise_for_status()
                break
            except requests.RequestException as e:
                logger.warning(f"ArXiv request attempt {attempt + 1} failed: {e}")
                if attempt == retries - 1:
                    return f" Error fetching from arXiv after {retries} attempts: {e}"
                time.sleep(2 ** attempt)

        if not response:
            return " Failed to get response from arXiv"

        try:
            root = ET.fromstring(response.text)
            ns = {'atom': 'http://www.w3.org/2005/Atom', 'arxiv': 'http://arxiv.org/schemas/atom'}
            entries = root.findall("atom:entry", ns)

            if not entries:
                logger.info("No results found, trying broader search")
                alt_url = f"https://export.arxiv.org/api/query?search_query=all:{cleaned_query}&start=0&max_results=5&sortBy=relevance&sortOrder=descending"
                try:
                    alt_response = requests.get(alt_url, headers=headers, timeout=15)
                    alt_response.raise_for_status()
                    alt_root = ET.fromstring(alt_response.text)
                    entries = alt_root.findall("atom:entry", ns)
                except:
                    pass

            results = []
            for i, entry in enumerate(entries[:3]):
                try:
                    title_elem = entry.find("atom:title", ns)
                    summary_elem = entry.find("atom:summary", ns)
                    id_elem = entry.find("atom:id", ns)
                    published_elem = entry.find("atom:published", ns)
                    
                    title = title_elem.text.strip() if title_elem is not None else "No title"
                    summary = summary_elem.text.strip() if summary_elem is not None else "No summary"
                    link = id_elem.text.strip() if id_elem is not None else "No link"
                    published = published_elem.text[:10] if published_elem is not None else "Unknown date"
                    
                    authors = []
                    author_elements = entry.findall("atom:author", ns)
                    for author_elem in author_elements[:3]:
                        name_elem = author_elem.find("atom:name", ns)
                        if name_elem is not None:
                            authors.append(name_elem.text.strip())
                    
                    author_str = ", ".join(authors) if authors else "Unknown authors"
                    if len(authors) > 3:
                        author_str += " et al."

                    result = f"**Paper {i+1}: {title}**\n"
                    result += f"Authors: {author_str}\n"
                    result += f"Published: {published}\n"
                    result += f"Summary: {summary[:400]}{'...' if len(summary) > 400 else ''}\n"
                    result += f"Link: {link}\n"
                    
                    results.append(result)

                except Exception as e:
                    logger.warning(f"Error parsing arXiv entry {i}: {e}")
                    continue

            if results:
                final_result = f"Found {len(results)} relevant academic papers on arXiv for '{query}':\n\n" + "\n".join(results)
                logger.info(f"ArXiv search successful, found {len(results)} papers")
                return final_result
            else:
                return f"No relevant academic papers found on arXiv for '{query}'. This might be a very specific or new topic, or the search terms may need adjustment."

        except ET.ParseError as e:
            logger.error(f"Failed to parse arXiv XML response: {e}")
            return " Failed to parse arXiv response. The service might be temporarily unavailable."
        except Exception as e:
            logger.error(f"Unexpected error in arXiv search: {e}")
            return f"Unexpected error while searching arXiv: {e}"

    def _run(self, query: str) -> str:
        if not query or not query.strip():
            return " Empty query provided for arXiv search"
        return self._search_arxiv(query)

    async def _arun(self, query: str) -> str:
        return self._search_arxiv(query)

# Create a singleton instance
arxiv_tool = ArxivTool()
