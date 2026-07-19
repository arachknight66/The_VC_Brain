"""Collects public, indexed LinkedIn evidence for an activated founder."""
from __future__ import annotations

from urllib.parse import urlparse

from agents.base import agent_stage
from memory.models import FounderRecord, SourceEvidence
from utils.tavily_client import search


def _is_linkedin(url: str) -> bool:
    return "linkedin.com" in urlparse(url).netloc.lower()


@agent_stage("linkedin_evidence")
def run(record: FounderRecord) -> FounderRecord:
    supplied_url = (record.raw_inputs.get("linkedin_url") or "").strip()
    query = f'site:linkedin.com/in "{record.name}"'
    if record.company_name:
        query += f' "{record.company_name}"'
    results = search(query, max_results=5)
    evidence: list[SourceEvidence] = []
    seen: set[str] = set()
    for result in results:
        url = (result.get("url") or "").strip()
        if not url or not _is_linkedin(url) or url in seen:
            continue
        seen.add(url)
        provider_score = float(result.get("score") or 0.0)
        url_match = bool(supplied_url and supplied_url.rstrip("/") == url.rstrip("/"))
        evidence.append(
            SourceEvidence(
                source="linkedin",
                title=result.get("title") or f"{record.name} on LinkedIn",
                url=url,
                content=(result.get("content") or "")[:4000],
                confidence=round(max(provider_score, 0.95 if url_match else 0.0), 2),
            )
        )
    record.source_evidence = [
        item for item in record.source_evidence if item.source != "linkedin"
    ] + evidence
    return record
