"""Lightweight identity consistency check: does the founder name in the deck
match the identity implied by their GitHub handle / LinkedIn URL?

Fuzzy string matching only (rapidfuzz) — no external identity API calls.
Sets entity_resolution_confidence rather than silently proceeding on a
mismatch or ambiguity (build.md Section 5.2).
"""
from __future__ import annotations

import re

from rapidfuzz import fuzz

from agents.base import agent_stage
from memory.models import FounderRecord

MISMATCH_THRESHOLD = 55  # token_set_ratio below this is flagged as a likely mismatch


def _slug_to_words(slug: str) -> str:
    """Turns 'priya-nandakumar-dev' or 'priyanandakumar123' into a space-joined string."""
    slug = re.sub(r"[-_./]+", " ", slug)
    slug = re.sub(r"\d+", " ", slug)
    return slug.strip()


def _handle_from_linkedin_url(url: str) -> str:
    return url.rstrip("/").split("/")[-1]


@agent_stage("entity_resolution")
def run(record: FounderRecord) -> FounderRecord:
    name = record.name
    raw = record.raw_inputs

    candidates: list[tuple[str, str]] = []
    if raw.get("github_handle"):
        candidates.append(("github_handle", _slug_to_words(raw["github_handle"])))
    if raw.get("linkedin_url"):
        candidates.append(("linkedin_url", _slug_to_words(_handle_from_linkedin_url(raw["linkedin_url"]))))

    if not candidates:
        # Nothing external to cross-check against — not a mismatch, just N/A.
        record.entity_resolution_confidence = None
        return record

    scores = [fuzz.token_set_ratio(name.lower(), candidate.lower()) for _, candidate in candidates]
    best = max(scores)
    # entity_resolution_confidence IS the flag: low confidence = the mismatch is
    # surfaced (in the UI / memo) rather than silently proceeding as if resolved.
    record.entity_resolution_confidence = round(best / 100.0, 2)

    return record
