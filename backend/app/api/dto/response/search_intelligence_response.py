from pydantic import BaseModel

from app.domain.search_intelligence.result.search_result import SearchResult


class SearchIntelligenceResponse(BaseModel):
    results: list[SearchResult]

