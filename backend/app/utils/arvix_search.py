import xml.etree.ElementTree as ET
import requests
import time
from typing import Optional
from langchain.tools import BaseTool
from pydantic import BaseModel, Field

class ArxivInput(BaseModel):
    query: str = Field(..., description="Academic or research topic to search for in arXiv")

class ArxivTool(BaseTool):
    name: str = "Arxiv Search"
    description: str = "Useful for finding academic research papers on a given topic using arXiv."
    args_schema:str = ArxivInput

    def _search_arxiv(self, query: str) -> str:
        url = f"https://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results=3"
        retries = 3

        for attempt in range(retries):
            try:
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                break
            except requests.RequestException as e:
                if attempt == retries - 1:
                    return f"❌ Error fetching from arXiv after {retries} attempts: {e}"
                time.sleep(2)

        try:
            root = ET.fromstring(response.text)
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            entries = root.findall("atom:entry", ns)

            results = []
            for entry in entries:
                title = entry.find("atom:title", ns).text.strip()
                summary = entry.find("atom:summary", ns).text.strip()
                link = entry.find("atom:id", ns).text.strip()
                results.append(f"**{title}**\n{summary[:300]}...\nLink: {link}")

            return "\n\n".join(results) if results else "No relevant papers found on arXiv."

        except ET.ParseError:
            return "❌ Failed to parse arXiv response. Try again later."

    def _run(self, query: str) -> str:
        return self._search_arxiv(query)

    async def _arun(self, query: str) -> str:
        # You can use httpx or aiohttp for true async requests if needed
        return self._search_arxiv(query)
