from datetime import datetime

from pydantic import BaseModel


class SearchCitation(BaseModel):
    citation_id: str
    source_url: str
    normalized_url: str
    title: str
    retrieved_at: datetime
    evidence_span: str | None = None

