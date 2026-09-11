"""Compound natural-language query parsing and filtering agent.

Resolves multi-attribute queries (e.g. 'technical founder, Berlin, AI infra,
enterprise traction, no prior VC backing, top-tier accelerator') in a single pass.
Uses LLM to extract structured filter criteria with fallback to keywords in stub mode,
followed by fast, deterministic in-memory filtering and ranking.
"""
from __future__ import annotations

import logging
from typing import Any

from memory.models import FounderRecord
from utils.openai_client import chat_json

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert VC associate analyzing investor queries for founder and startup search.
Your job is to parse a free-text compound search query into a strict JSON object with structured filter fields.

You must output ONLY a valid JSON object with the following fields:
{
  "sector": str | null,
  "geography": str | null,
  "stage": str | null,
  "technical_founder": bool | null,
  "has_funding_history": bool | null,
  "has_accelerator_history": bool | null,
  "min_traction_signal": bool | null,
  "keywords": [str, ...]
}

Field instructions:
- "sector": Startup sector or domain if mentioned (e.g. "developer tools", "fintech", "healthtech", "ai", "climate tech", "b2b enterprise"), else null.
- "geography": Country, city, or region if mentioned (e.g. "US", "EU", "Berlin", "Europe", "UK"), else null.
- "stage": Investment stage if mentioned (e.g. "pre-seed", "seed", "series a"), else null.
- "technical_founder": true if user requests technical founders, engineer founders, or CTOs; false if explicitly non-technical; else null.
- "has_funding_history": true if user wants prior VC/funding, false if user explicitly asks for "unfunded", "bootstrapped", "no prior VC backing", or "first round"; else null.
- "has_accelerator_history": true if user wants accelerator alumni (e.g. "top-tier accelerator", "YC", "Techstars"), false if explicitly no accelerator; else null.
- "min_traction_signal": true if user mentions "traction", "enterprise traction", "revenue", "verified claims", or "working product"; else null.
- "keywords": List of remaining relevant search tokens, terms, or phrases from the query that are not captured in the fields above, or terms to use for soft matching. If unsure about a field, leave it null and put the term in keywords.

Never invent criteria not implied by the query text. Output strictly JSON.
"""

GEO_SYNONYMS: dict[str, set[str]] = {
    "us": {"us", "usa", "united states", "america", "sf", "san francisco", "nyc", "new york", "seattle", "austin", "boston"},
    "eu": {"eu", "europe", "european", "berlin", "germany", "uk", "london", "paris", "france", "stockholm", "sweden", "amsterdam"},
}


def parse_query(query_text: str) -> dict[str, Any]:
    """Parses a compound free-text query into structured filters.
    
    Falls back gracefully to keyword-only mode if the LLM is in stub mode
    or unavailable.
    """
    cleaned_query = (query_text or "").strip()
    if not cleaned_query:
        return {
            "sector": None,
            "geography": None,
            "stage": None,
            "technical_founder": None,
            "has_funding_history": None,
            "has_accelerator_history": None,
            "min_traction_signal": None,
            "keywords": [],
        }

    parsed = chat_json(SYSTEM_PROMPT, cleaned_query)
    if not parsed or parsed.get("_stub"):
        return {
            "sector": None,
            "geography": None,
            "stage": None,
            "technical_founder": None,
            "has_funding_history": None,
            "has_accelerator_history": None,
            "min_traction_signal": None,
            "keywords": [cleaned_query],
        }

    # Normalize extracted fields
    def _opt_str(val: Any) -> str | None:
        if isinstance(val, str) and val.strip():
            return val.strip()
        return None

    def _opt_bool(val: Any) -> bool | None:
        if isinstance(val, bool):
            return val
        return None

    raw_keywords = parsed.get("keywords")
    if isinstance(raw_keywords, list):
        keywords = [str(k).strip() for k in raw_keywords if str(k).strip()]
    elif isinstance(raw_keywords, str) and raw_keywords.strip():
        keywords = [raw_keywords.strip()]
    else:
        keywords = []

    return {
        "sector": _opt_str(parsed.get("sector")),
        "geography": _opt_str(parsed.get("geography")),
        "stage": _opt_str(parsed.get("stage")),
        "technical_founder": _opt_bool(parsed.get("technical_founder")),
        "has_funding_history": _opt_bool(parsed.get("has_funding_history")),
        "has_accelerator_history": _opt_bool(parsed.get("has_accelerator_history")),
        "min_traction_signal": _opt_bool(parsed.get("min_traction_signal")),
        "keywords": keywords,
    }


def _matches_sector(record_sector: str | None, query_sector: str | None) -> bool:
    if not query_sector:
        return True
    if not record_sector:
        return False
    rec = record_sector.strip().lower()
    q = query_sector.strip().lower()
    return q in rec or rec in q


def _matches_geography(record_geo: str | None, query_geo: str | None) -> bool:
    if not query_geo:
        return True
    if not record_geo:
        return False
    rec = record_geo.strip().lower()
    q = query_geo.strip().lower()

    if q == rec or q in rec or rec in q:
        return True

    for region, syns in GEO_SYNONYMS.items():
        if (q == region or q in syns) and (rec == region or rec in syns):
            return True

    return False


def _matches_stage(record_stage: str | None, query_stage: str | None) -> bool:
    if not query_stage:
        return True
    if not record_stage:
        return False
    rec = record_stage.strip().lower().replace("-", "").replace(" ", "")
    q = query_stage.strip().lower().replace("-", "").replace(" ", "")

    if q in ("preseed", "pre"):
        return rec in ("preseed", "pre")
    if q == "seed":
        return rec == "seed"
    return q == rec or (q in rec and "pre" not in rec and "pre" not in q)


def _is_technical_founder(record: FounderRecord) -> bool:
    raw = record.raw_inputs or {}
    if bool(raw.get("github_handle")):
        return True
    deck = (raw.get("deck_text") or "").lower()
    return any(term in deck for term in ("technical", "engineer", "cto", "software"))


def _has_traction_signal(record: FounderRecord) -> bool:
    # True if record has >=1 verified claim or strong founder score
    has_verified_claim = any(
        c.evidence_category != "unverifiable" and not c.contradiction_flag
        for c in record.trust_claims
    )
    has_good_score = record.founder_score.value >= 50.0
    return has_verified_claim or has_good_score


def apply_filters(records: list[FounderRecord], filters: dict[str, Any]) -> list[tuple[FounderRecord, float]]:
    """Pure-Python filtering and ranking against FounderRecord fields.
    
    Hard filters exclude non-matching records entirely:
    - sector, stage, geography
    - technical_founder, has_funding_history, has_accelerator_history, min_traction_signal
    
    Keywords are applied as soft score boosts, never excluding matching records.
    """
    sector_filter = filters.get("sector")
    geo_filter = filters.get("geography")
    stage_filter = filters.get("stage")
    tech_filter = filters.get("technical_founder")
    funding_filter = filters.get("has_funding_history")
    accel_filter = filters.get("has_accelerator_history")
    traction_filter = filters.get("min_traction_signal")
    keywords = [k.strip().lower() for k in filters.get("keywords", []) if k.strip()]

    scored_results: list[tuple[FounderRecord, float]] = []

    for record in records:
        raw = record.raw_inputs or {}

        # 1. Hard filter: Sector
        if sector_filter and not _matches_sector(raw.get("sector"), sector_filter):
            continue

        # 2. Hard filter: Geography
        if geo_filter and not _matches_geography(raw.get("geography"), geo_filter):
            continue

        # 3. Hard filter: Stage
        if stage_filter and not _matches_stage(raw.get("stage"), stage_filter):
            continue

        # 4. Hard filter: Technical Founder
        if tech_filter is not None:
            if _is_technical_founder(record) != tech_filter:
                continue

        # 5. Hard filter: Funding History
        if funding_filter is not None:
            if bool(raw.get("has_funding_history")) != funding_filter:
                continue

        # 6. Hard filter: Accelerator History
        if accel_filter is not None:
            if bool(raw.get("has_accelerator_history")) != accel_filter:
                continue

        # 7. Hard filter: Minimum Traction Signal
        if traction_filter is True:
            if not _has_traction_signal(record):
                continue

        # Baseline score composed of base matching value + fraction of existing founder score
        score = 50.0 + (record.founder_score.value * 0.3)

        # Soft boost: Keywords
        searchable_text = " ".join([
            record.company_name or "",
            record.name or "",
            raw.get("sector") or "",
            raw.get("stage") or "",
            raw.get("geography") or "",
            raw.get("deck_text") or "",
        ]).lower()

        for kw in keywords:
            if kw in searchable_text:
                score += 15.0

        scored_results.append((record, score))

    scored_results.sort(key=lambda item: item[1], reverse=True)
    return scored_results


def run(query_text: str, records: list[FounderRecord]) -> list[dict[str, Any]]:
    """Parses query text and filters/ranks records, returning serialized results."""
    filters = parse_query(query_text)
    filtered = apply_filters(records, filters)
    return [
        {
            "founder": record.to_dict(),
            "match_score": round(score, 2),
            "matched_filters": filters,
        }
        for record, score in filtered
    ]
