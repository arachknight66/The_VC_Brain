"""Founder Score formula (build.md Section 5.9).

founder_score.value is a weighted blend of three components, each 0-100:
  - axis_component (60%): mean of the three independent axis scores
    (founder / market / idea_vs_market). NOTE: this is the one place the
    three axes are combined — axis_scores itself is never collapsed; this
    is a *separate*, persistent cross-opportunity metric, not "the"
    investment decision.
  - trust_component (25%): mean confidence across extracted trust_claims,
    with any contradicted claim forced to 0 regardless of its stated
    confidence (a contradiction is a red flag, not partial credit).
  - build_component (15%): build_evidence tier mapped to a fixed score
    (verified_working=100, verified_submitted=60, unverifiable=20).
    Skipped (weight redistributed to axis/trust) when build_evidence is
    not_applicable, i.e. the founder made no build claim to check.

founder_score.confidence reflects how much independent evidence backs the
value (entity resolution confidence, fraction of trust claims that cleared
"unverifiable", and the build-evidence tier) — capped at 0.5 when the score
relies on the cold-start public-footprint fallback (Section 5.10), since
that's an explicitly lower-confidence proxy signal.
"""
from __future__ import annotations

from memory.models import FounderRecord

AXIS_WEIGHT = 0.60
TRUST_WEIGHT = 0.25
BUILD_WEIGHT = 0.15

BUILD_TIER_SCORE = {
    "verified_working": 100.0,
    "verified_submitted": 60.0,
    "unverifiable": 20.0,
}

TREND_EPSILON = 2.0


def _axis_component(record: FounderRecord) -> float:
    scores = [a.score for a in record.axis_scores.values()]
    return sum(scores) / len(scores) if scores else 50.0


def _trust_component(record: FounderRecord) -> float:
    if not record.trust_claims:
        return 50.0  # neutral: nothing to check
    values = [0.0 if c.contradiction_flag else c.confidence * 100 for c in record.trust_claims]
    return sum(values) / len(values)


def _build_component(record: FounderRecord) -> tuple[float, bool]:
    tier = record.build_evidence.tier
    if tier not in BUILD_TIER_SCORE:
        return 0.0, False  # not_applicable: excluded from the weighted blend
    return BUILD_TIER_SCORE[tier], True


def compute_founder_score(record: FounderRecord, previous_value: float | None = None) -> None:
    """Computes and writes record.founder_score.value / trend / confidence
    in place. Does NOT touch confidence_basis or history — those are set by
    the cold-start agent and the store's upsert(), respectively.
    """
    axis_component = _axis_component(record)
    trust_component = _trust_component(record)
    build_component, build_applicable = _build_component(record)

    if build_applicable:
        weights = (AXIS_WEIGHT, TRUST_WEIGHT, BUILD_WEIGHT)
    else:
        redistribute = AXIS_WEIGHT + TRUST_WEIGHT
        weights = (AXIS_WEIGHT / redistribute, TRUST_WEIGHT / redistribute, 0.0)

    value = axis_component * weights[0] + trust_component * weights[1] + build_component * weights[2]
    value = max(0.0, min(100.0, value))

    if previous_value is None or abs(value - previous_value) <= TREND_EPSILON:
        trend = "stable" if previous_value is not None else "stable"
    elif value > previous_value:
        trend = "improving"
    else:
        trend = "declining"

    evidence_signals = []
    if record.entity_resolution_confidence is not None:
        evidence_signals.append(record.entity_resolution_confidence)
    if record.trust_claims:
        verified_fraction = sum(1 for c in record.trust_claims if c.evidence_category != "unverifiable") / len(record.trust_claims)
        evidence_signals.append(verified_fraction)
    if build_applicable:
        evidence_signals.append(build_component / 100.0)
    confidence = sum(evidence_signals) / len(evidence_signals) if evidence_signals else 0.5

    if record.founder_score.confidence_basis == "public_footprint_fallback":
        confidence = min(confidence, 0.5)

    record.founder_score.value = round(value, 1)
    record.founder_score.trend = trend
    record.founder_score.confidence = round(confidence, 2)
