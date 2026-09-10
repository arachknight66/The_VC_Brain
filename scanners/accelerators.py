"""Accelerator cohort scanner matching companies from curated cohort datasets."""
from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path

from rapidfuzz import fuzz

from memory.signals import Signal

logger = logging.getLogger(__name__)

DEFAULT_COHORTS_PATH = Path(__file__).resolve().parent.parent / "data" / "accelerator_cohorts.json"
MATCH_THRESHOLD = 70.0


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _load_cohorts(path: Path | str | None = None) -> list[dict]:
    target_path = Path(path) if path else DEFAULT_COHORTS_PATH
    if not target_path.exists():
        logger.warning("Accelerator cohorts file not found at %s", target_path)
        return []
    try:
        with open(target_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to load accelerator cohorts from %s: %s", target_path, exc)
        return []


def scan(query: str, *, max_results: int = 10, cohorts_path: Path | str | None = None) -> list[Signal]:
    normalized_query = query.strip().lower()
    if not normalized_query:
        return []

    cohorts = _load_cohorts(cohorts_path)
    candidates: list[tuple[float, str, str, str]] = []

    for cohort in cohorts:
        accelerator = cohort.get("accelerator", "Unknown Accelerator")
        batch = cohort.get("batch", "Recent")
        for company in cohort.get("companies", []):
            comp_lower = company.lower()

            # Direct substring or exact match
            if normalized_query == comp_lower:
                score = 100.0
            elif normalized_query in comp_lower or comp_lower in normalized_query:
                score = 90.0
            else:
                ratio = fuzz.token_set_ratio(normalized_query, comp_lower)
                partial = fuzz.partial_ratio(normalized_query, comp_lower)
                score = max(float(ratio), float(partial))

            if score >= MATCH_THRESHOLD:
                candidates.append((score, company, accelerator, batch))

    # Sort descending by match score
    candidates.sort(key=lambda x: x[0], reverse=True)

    signals: list[Signal] = []
    seen_ids: set[str] = set()

    for score, company, accelerator, batch in candidates[:max_results]:
        ext_id = f"accelerator-{_slugify(accelerator)}-{_slugify(batch)}-{_slugify(company)}"
        if ext_id in seen_ids:
            continue
        seen_ids.add(ext_id)

        signals.append(
            Signal(
                source="accelerator",
                external_id=ext_id,
                title=f"{company} ({accelerator} {batch})",
                source_url=f"https://www.google.com/search?q={_slugify(accelerator)}+{_slugify(company)}",
                summary=f"{company} is a backed company in {accelerator} ({batch} cohort).",
                query=query,
                score=round(score, 2),
                raw_payload={
                    "accelerator": accelerator,
                    "batch": batch,
                    "company": company,
                    "match_score": round(score, 2),
                },
            )
        )

    return signals
