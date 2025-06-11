import xml.etree.ElementTree as ET
import requests

class ArxivTool:
    def run(self, query: str) -> str:
        url = f"http://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results=3"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except requests.RequestException as e:
            return f"Error fetching data from arXiv: {e}"

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
                
            return "\n\n".join(results) if results else "No results found."

        except ET.ParseError:
            return "Failed to parse arXiv API response."
