from duckduckgo_search import DDGS

class WebSearchTool:
    def run(self, query: str) -> str:
        with DDGS() as ddgs:
            results = ddgs.text(query)
            top_results = results[:5]  # Limit to top 5 results
            return "\n".join(
                f"{r['title']} - {r['body']} ({r['href']})"
                for r in top_results
            )
