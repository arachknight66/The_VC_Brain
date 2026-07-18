from app.domain.search_intelligence.result.search_result import SearchResult


class SearchDeduplicationService:
    def deduplicate(self, results: list[SearchResult]) -> list[SearchResult]:
        seen: set[str] = set()
        deduplicated: list[SearchResult] = []
        for result in results:
            if result.normalized_url in seen:
                continue
            seen.add(result.normalized_url)
            deduplicated.append(result)
        return deduplicated

