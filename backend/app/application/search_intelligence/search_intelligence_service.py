from app.application.search_intelligence.pipeline.search_pipeline import SearchPipeline
from app.domain.search_intelligence.query.search_intent import SearchIntent
from app.domain.search_intelligence.result.search_result import SearchResult


class SearchIntelligenceService:
    def __init__(self, pipeline: SearchPipeline) -> None:
        self.pipeline = pipeline

    async def search(self, intent: SearchIntent) -> list[SearchResult]:
        return await self.pipeline.run(intent)

