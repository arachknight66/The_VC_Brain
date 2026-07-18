from app.domain.search_intelligence.query.generated_query import GeneratedQuery
from app.domain.search_intelligence.result.search_result import SearchResult
from app.port.search.search_cache import SearchCache


class SearchCacheService:
    def __init__(self, cache: SearchCache) -> None:
        self.cache = cache

    async def get_many(self, queries: list[GeneratedQuery]) -> dict[str, SearchResult]:
        return {}

    async def set_many(self, results: list[SearchResult]) -> None:
        return None

