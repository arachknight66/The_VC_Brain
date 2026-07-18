from pydantic import BaseModel, Field


class SearchIntent(BaseModel):
    company: str | None = None
    founder: str | None = None
    technology: str | None = None
    industry: str | None = None
    market: str | None = None
    stage: str | None = None
    country: str | None = None
    investment_thesis: str | None = None
    recent_events: list[str] = Field(default_factory=list)
    max_queries: int = Field(default=8, ge=1, le=25)

