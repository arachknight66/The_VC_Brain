from app.domain.search_intelligence.result.search_result import SearchResult


class SearchRankingService:
    def rank(self, results: list[SearchResult]) -> list[SearchResult]:
        return sorted(results, key=lambda result: (result.relevance_score, result.confidence), reverse=True)

