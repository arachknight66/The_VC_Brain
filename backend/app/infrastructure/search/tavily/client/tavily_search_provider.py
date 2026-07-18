from datetime import UTC, datetime
from urllib.parse import urlparse

import httpx

from app.domain.search_intelligence.query.generated_query import GeneratedQuery
from app.domain.search_intelligence.result.search_result import SearchResult
from app.infrastructure.search.tavily.config.tavily_settings import TavilySettings
from app.port.search.search_provider import SearchProvider


class TavilySearchProvider(SearchProvider):
    def __init__(self, settings: TavilySettings) -> None:
        self.settings = settings

    async def search(self, query: GeneratedQuery) -> list[SearchResult]:
        async with httpx.AsyncClient(timeout=self.settings.tavily_timeout_seconds) as client:
            response = await client.post(
                f"{self.settings.tavily_base_url}/search",
                json={
                    "api_key": self.settings.tavily_api_key,
                    "query": query.query_text,
                    "max_results": self.settings.tavily_default_max_results,
                    "include_raw_content": True,
                },
            )
            response.raise_for_status()
            payload = response.json()

        results = []
        for index, item in enumerate(payload.get("results", [])):
            url = item.get("url", "")
            parsed = urlparse(url)
            results.append(
                SearchResult(
                    source_url=url,
                    normalized_url=f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/"),
                    title=item.get("title") or "Untitled",
                    snippet=item.get("content"),
                    author=None,
                    publication_date=None,
                    domain=parsed.netloc,
                    search_query=query.query_text,
                    confidence=min(100, max(0, float(item.get("score", 0)) * 100)),
                    relevance_score=min(100, max(0, float(item.get("score", 0)) * 100)),
                    category=query.category,
                    language=None,
                    retrieved_timestamp=datetime.now(UTC),
                    citation_id=f"CIT-{query.deterministic_key[:8]}-{index + 1}",
                    raw_response=item,
                    structured_metadata={"provider": "tavily"},
                )
            )
        return results

