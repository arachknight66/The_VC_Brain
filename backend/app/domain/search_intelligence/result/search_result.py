from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, HttpUrl

from app.domain.search_intelligence.query.search_category import SearchCategory


class SearchResult(BaseModel):
    source_url: HttpUrl
    normalized_url: str
    title: str
    snippet: str | None = None
    author: str | None = None
    publication_date: datetime | None = None
    domain: str
    search_query: str
    confidence: float = Field(ge=0, le=100)
    relevance_score: float = Field(ge=0, le=100)
    category: SearchCategory
    language: str | None = None
    retrieved_timestamp: datetime
    citation_id: str
    raw_response: dict[str, Any]
    structured_metadata: dict[str, Any] = Field(default_factory=dict)

