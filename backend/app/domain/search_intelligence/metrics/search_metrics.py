from pydantic import BaseModel, Field


class SearchMetrics(BaseModel):
    query_count: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    retries: int = 0
    failures: int = 0
    duration_ms: float = Field(default=0, ge=0)

