from pydantic import BaseModel, Field

from app.domain.search_intelligence.query.search_category import SearchCategory


class GeneratedQuery(BaseModel):
    query_text: str
    category: SearchCategory
    priority: int = Field(ge=1, le=10)
    rationale: str
    deterministic_key: str

