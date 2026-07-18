import asyncio
import os
from pathlib import Path

import pytest

from app.domain.search_intelligence.query.generated_query import GeneratedQuery
from app.domain.search_intelligence.query.search_category import SearchCategory
from app.infrastructure.search.tavily.client.tavily_search_provider import TavilySearchProvider
from app.infrastructure.search.tavily.config.tavily_settings import TavilySettings


def _load_local_tavily_key() -> str | None:
    if os.environ.get("TAVILY_API_KEY"):
        return os.environ["TAVILY_API_KEY"]

    env_path = Path(__file__).resolve().parents[4] / ".env"
    if not env_path.exists():
        return None

    for line in env_path.read_text().splitlines():
        if line.startswith("TAVILY_API_KEY="):
            return line.split("=", 1)[1].strip() or None

    return None


def test_tavily_search_provider_returns_normalized_results() -> None:
    tavily_api_key = _load_local_tavily_key()
    if not tavily_api_key:
        pytest.skip("TAVILY_API_KEY is not configured.")

    async def run_search():
        provider = TavilySearchProvider(TavilySettings(tavily_api_key=tavily_api_key))
        query = GeneratedQuery(
            query_text="OpenAI funding news",
            category=SearchCategory.FUNDING_NEWS,
            priority=10,
            rationale="Integration test for Tavily result normalization.",
            deterministic_key="test-openai-funding-news",
        )
        return await provider.search(query)

    results = asyncio.run(run_search())

    assert results
    first_result = results[0]
    assert first_result.title
    assert str(first_result.source_url).startswith("http")
    assert first_result.normalized_url.startswith("http")
    assert first_result.domain
    assert first_result.search_query == "OpenAI funding news"
    assert first_result.category == SearchCategory.FUNDING_NEWS
    assert 0 <= first_result.relevance_score <= 100
    assert 0 <= first_result.confidence <= 100
    assert first_result.citation_id.startswith("CIT-")
    assert first_result.raw_response
    assert first_result.structured_metadata["provider"] == "tavily"
