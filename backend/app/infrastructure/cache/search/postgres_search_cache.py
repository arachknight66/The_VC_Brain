from app.port.search.search_cache import SearchCache


class PostgresSearchCache(SearchCache):
    async def get(self, key: str) -> dict | None:
        return None

    async def set(self, key: str, value: dict, ttl_seconds: int) -> None:
        return None

