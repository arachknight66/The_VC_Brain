from app.domain.search_intelligence.result.search_result import SearchResult


class SearchEvidenceExtractionService:
    def prepare(self, results: list[SearchResult]) -> list[SearchResult]:
        return results

