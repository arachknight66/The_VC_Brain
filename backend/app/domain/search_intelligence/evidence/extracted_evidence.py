from pydantic import BaseModel, Field


class ExtractedEvidence(BaseModel):
    facts: list[str] = Field(default_factory=list)
    claims: list[str] = Field(default_factory=list)
    metrics: list[str] = Field(default_factory=list)
    dates: list[str] = Field(default_factory=list)
    numbers: list[str] = Field(default_factory=list)
    companies: list[str] = Field(default_factory=list)
    people: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    funding_events: list[str] = Field(default_factory=list)
    customer_names: list[str] = Field(default_factory=list)
    market_signals: list[str] = Field(default_factory=list)
    extraction_confidence: float = Field(ge=0, le=100)

