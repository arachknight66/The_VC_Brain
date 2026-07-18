from app.domain.search_intelligence.query.search_intent import SearchIntent


class SearchMetricsService:
    def record(self, intent: SearchIntent, query_count: int, result_count: int) -> None:
        return None

