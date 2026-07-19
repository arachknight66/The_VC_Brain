"""Fast first-pass screening: does the founder record match the fund's thesis?

Uses keyword matching rather than an LLM call, deliberately — this stage
exists specifically to filter out clear non-fits *before* spending API
calls on full 3-axis scoring / trust verification (build.md Section 5.4).

The thesis is a plain, parameterized config object (DEFAULT_THESIS below),
not hardcoded branching logic — callers can pass a different thesis to
run() for a different fund/check.
"""
from __future__ import annotations

from agents.base import agent_stage
from memory.models import FounderRecord

DEFAULT_THESIS = {
    "sectors": [
        "fintech",
        "ai/ml",
        "ai",
        "developer tools",
        "climate tech",
        "healthtech",
        "productivity",
        "saas",
        "web3/crypto",
        "b2b enterprise",
        "deep tech",
        "edtech",
        "e-commerce",
        "logistics",
        "cybersecurity",
        "hardware",
        "space tech",
        "robotics",
        "proptech",
        "energy",
        "gaming",
    ],
    "stages": ["pre-seed", "seed"],
    "geographies": [
        "us",
        "eu",
        "global",
        "remote",
        "latam",
        "apac",
        "mena",
        "uk",
        "canada",
        "india",
        "southeast asia",
        "east asia",
        "africa",
    ],
    "check_size": "$250K-$1.5M",
    "ownership_target": "7-15%",
    "risk_appetite": "high",
}


def _matches(value: str | None, allowed: list[str]) -> bool:
    if not value:
        return True  # unknown field: don't screen out on missing data alone
    return value.strip().lower() in {a.lower() for a in allowed}


@agent_stage("thesis_matching")
def run(record: FounderRecord, thesis: dict | None = None) -> FounderRecord:
    thesis = thesis or DEFAULT_THESIS
    raw = record.raw_inputs

    sector_ok = _matches(raw.get("sector"), thesis["sectors"])
    stage_ok = _matches(raw.get("stage"), thesis["stages"])
    geo_ok = _matches(raw.get("geography"), thesis["geographies"])

    if sector_ok and stage_ok and geo_ok:
        record.screened_out = False
        record.screened_out_reason = None
        return record

    reasons = []
    if not sector_ok:
        reasons.append(f"sector '{raw.get('sector')}' outside thesis sectors {thesis['sectors']}")
    if not stage_ok:
        reasons.append(f"stage '{raw.get('stage')}' outside thesis stages {thesis['stages']}")
    if not geo_ok:
        reasons.append(f"geography '{raw.get('geography')}' outside thesis geographies {thesis['geographies']}")

    record.screened_out = True
    record.screened_out_reason = "; ".join(reasons)
    return record
