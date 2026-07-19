"""Cold-start handling (build.md Section 5.10).

If a founder has no GitHub history, no funding history, and no accelerator
record, the standard track-record signals are empty. Rather than scoring
with nothing, this falls back to a Tavily search for the founder's public
writing/engagement (Twitter/X, blog, community posts) as a lower-confidence
proxy signal, and explicitly labels the resulting score with
confidence_basis="public_footprint_fallback" so it's visibly distinguished
in the UI from track-record-based scoring.
"""
from __future__ import annotations

from agents.base import agent_stage
from memory.models import FounderRecord
from utils.tavily_client import search


def _is_cold_start(raw: dict) -> bool:
    return not raw.get("github_handle") and not raw.get("has_funding_history") and not raw.get("has_accelerator_history")


def _result_text(result: dict) -> str:
    return f"{result.get('title', '')} {result.get('content', '')} {result.get('url', '')}".lower()


@agent_stage("cold_start_check")
def run(record: FounderRecord) -> FounderRecord:
    raw = record.raw_inputs
    if not _is_cold_start(raw):
        return record

    handle_terms = [t for t in (raw.get("twitter_handle"), raw.get("blog_url")) if t]
    handle_clause = " OR ".join(f'"{t}"' for t in handle_terms) if handle_terms else "blog OR twitter OR community post"
    results = search(f'"{record.name}" {handle_clause}', max_results=4)
    matches = [r for r in results if record.name.lower() in _result_text(r)]

    record.founder_score.confidence_basis = "public_footprint_fallback"
    record.raw_inputs["_cold_start_footprint_evidence"] = [
        {"title": m.get("title"), "url": m.get("url")} for m in matches
    ]
    return record
