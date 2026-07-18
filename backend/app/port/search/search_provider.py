from abc import ABC, abstractmethod

from app.domain.search_intelligence.query.generated_query import GeneratedQuery
from app.domain.search_intelligence.result.search_result import SearchResult


class SearchProvider(ABC):
    @abstractmethod
    async def search(self, query: GeneratedQuery) -> list[SearchResult]:
        """Execute a provider search and return normalized results."""

