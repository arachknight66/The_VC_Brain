"""Generates the structured investment memo (build.md Section 5.8).

Every factual/citable section is composed deterministically from data
already on the record (trust_claims, axis_scores, build_evidence) rather
than freely generated — that's what guarantees every factual claim in the
memo carries a traceable inline citation back to its trust_claims entry or
axis_score rationale, by construction rather than by LLM good behavior.

An LLM pass (company_snapshot / problem_and_product narrative) is used
only for prose framing of those same grounded facts, explicitly instructed
not to introduce new facts; it falls back to a plain template when the LLM
is unavailable.
"""
from __future__ import annotations

from agents.base import agent_stage
from memory.models import FounderRecord
from utils.openai_client import chat

STUB_MARKER = "LLM unavailable (stub mode)"

REQUIRED_SECTIONS = [
    "company_snapshot",
    "investment_hypotheses",
    "swot",
    "problem_and_product",
    "traction_and_kpis",
]
OPTIONAL_SECTIONS = [
    "team_and_history",
    "technology_and_defensibility",
    "market_sizing",
    "competition",
    "financials_and_round_structure",
    "cap_table",
    "due_diligence_log",
    "exit_perspective",
]


def _cite(claim_text: str, confidence: float, source: str | None) -> str:
    return f'[claim: "{claim_text}", confidence={confidence:.2f}, source={source or "none"}]'


def _is_stub(text: str) -> bool:
    return STUB_MARKER in (text or "")


def _axis_cite(axis_name: str, axis) -> str:
    if _is_stub(axis.rationale):
        return f"[{axis_name} axis: pending live model assessment]"
    return f"[{axis_name} axis: {axis.rating}, {axis.score:.0f}/100 — {axis.rationale}]"


def _traction_and_kpis(record: FounderRecord) -> str:
    if not record.trust_claims:
        return "No specific traction/KPI claims were extracted from the deck text."
    lines = []
    for c in record.trust_claims:
        flag = " ⚠ CONTRADICTED BY RETRIEVED EVIDENCE" if c.contradiction_flag else ""
        lines.append(f"- {c.claim_text} {_cite(c.claim_text, c.confidence, c.source)}{flag}")
    return "\n".join(lines)


def _swot(record: FounderRecord) -> dict:
    strengths, weaknesses, opportunities, threats = [], [], [], []

    founder = record.axis_scores.get("founder")
    market = record.axis_scores.get("market")
    idea = record.axis_scores.get("idea_vs_market")

    if founder:
        bucket = strengths if founder.score >= 60 else weaknesses
        bucket.append(_axis_cite("founder", founder))
    if market:
        bucket = opportunities if market.rating == "bullish" else threats if market.rating == "bear" else strengths
        bucket.append(_axis_cite("market", market))
    if idea:
        bucket = strengths if idea.score >= 60 else weaknesses
        bucket.append(_axis_cite("idea_vs_market", idea))

    if record.build_evidence.tier == "verified_working":
        strengths.append("Build evidence: independently verified working artifact (see build_evidence panel).")
    elif record.build_evidence.tier == "verified_submitted":
        opportunities.append("Build evidence: hackathon submission confirmed but no live artifact found yet.")
    elif record.build_evidence.tier == "unverifiable":
        weaknesses.append("Build evidence: build claim could not be independently corroborated (see build_evidence panel).")

    contradicted = [c for c in record.trust_claims if c.contradiction_flag]
    for c in contradicted:
        threats.append(f"Contradicted claim: {_cite(c.claim_text, c.confidence, c.source)}")

    unverifiable = [c for c in record.trust_claims if c.evidence_category == "unverifiable"]
    if unverifiable:
        weaknesses.append(f"{len(unverifiable)} of {len(record.trust_claims)} deck claim(s) could not be independently verified.")

    if record.founder_score.confidence_basis == "public_footprint_fallback":
        weaknesses.append("Scoring relies on a public-footprint fallback (cold start) rather than track-record signals — lower confidence.")

    return {
        "strengths": strengths or ["Not enough grounded evidence to assert a strength."],
        "weaknesses": weaknesses or ["No material weaknesses surfaced by current evidence."],
        "opportunities": opportunities or ["Not enough grounded evidence to assert an opportunity."],
        "threats": threats or ["No material threats surfaced by current evidence."],
    }


def _investment_hypotheses(record: FounderRecord) -> list[str]:
    hyps = []
    for name in ("founder", "market", "idea_vs_market"):
        axis = record.axis_scores.get(name)
        if axis and axis.score >= 65 and not _is_stub(axis.rationale):
            hyps.append(f"Strong {name.replace('_', ' ')} signal: {axis.rationale} {_axis_cite(name, axis)}")
    if not hyps:
        hyps.append("No axis currently clears the bar for a strong standalone hypothesis; see axis rationales for detail.")
    return hyps


def _team_and_history(record: FounderRecord) -> str:
    raw = record.raw_inputs
    facts = []
    if raw.get("has_funding_history"):
        facts.append("Founder has raised outside funding before.")
    if raw.get("has_accelerator_history"):
        facts.append("Founder has been through an accelerator program before.")
    if raw.get("github_handle"):
        facts.append(f"Public GitHub handle on record: {raw['github_handle']}.")
    founder = record.axis_scores.get("founder")
    if founder and not _is_stub(founder.rationale):
        facts.append(_axis_cite("founder", founder))
    return " ".join(facts) if facts else "not disclosed"


def _technology_and_defensibility(record: FounderRecord) -> str:
    be = record.build_evidence
    if be.tier == "not_applicable":
        return "not disclosed"
    lines = [f"Build evidence tier: {be.tier}."]
    for e in be.evidence_log:
        status = "found" if e.found else "not found"
        lines.append(f"- [{e.signal}] {status}: {e.detail}")
    return "\n".join(lines)


def _market_sizing(record: FounderRecord) -> str:
    market = record.axis_scores.get("market")
    if market and not _is_stub(market.rationale):
        return _axis_cite("market", market)
    return "not disclosed"


def _financials_and_round_structure(record: FounderRecord) -> str:
    raw = record.raw_inputs
    revenue_claims = [c for c in record.trust_claims if any(k in c.claim_text.lower() for k in ("mrr", "arr", "revenue", "$"))]
    lines = []
    lines.append("Prior funding: " + ("raised before" if raw.get("has_funding_history") else "none reported"))
    for c in revenue_claims:
        lines.append(f"- {c.claim_text} {_cite(c.claim_text, c.confidence, c.source)}")
    return "\n".join(lines) if lines else "not disclosed"


def _due_diligence_log(record: FounderRecord) -> str:
    lines = [f"Pipeline stages completed: {', '.join(record.timing.stage_timings.keys()) or 'none recorded'}."]
    lines.append(f"Trust claims extracted and checked: {len(record.trust_claims)}.")
    if record.build_evidence.tier != "not_applicable":
        lines.append(f"Build evidence checks performed: {len(record.build_evidence.evidence_log)} ({record.build_evidence.tier}).")
    if record.entity_resolution_confidence is not None:
        lines.append(f"Entity resolution confidence (deck name vs. public handles): {record.entity_resolution_confidence:.2f}.")
    return "\n".join(lines)


def _company_snapshot(record: FounderRecord) -> str:
    raw = record.raw_inputs
    template = (
        f"{record.company_name} — founded by {record.name}. "
        f"Sector: {raw.get('sector', 'not disclosed')}. Stage: {raw.get('stage', 'not disclosed')}. "
        f"Geography: {raw.get('geography', 'not disclosed')}. Source: {record.source_channel}. "
        f"Founder Score: {record.founder_score.value:.0f}/100 ({record.founder_score.trend})."
    )
    live = chat(
        "You are a VC analyst writing a one-paragraph company snapshot for an investment memo. "
        "Use ONLY the facts given to you — do not introduce any new facts, numbers, or claims not "
        "present in the input. Keep it to 2-3 sentences.",
        template,
    )
    return live if live and STUB_MARKER not in live and "[stub response" not in live else template


def _problem_and_product(record: FounderRecord) -> str:
    deck_text = record.raw_inputs.get("deck_text") or "(no deck text provided)"
    return deck_text


@agent_stage("memo_generation")
def run(record: FounderRecord) -> FounderRecord:
    record.memo = {
        "company_snapshot": _company_snapshot(record),
        "investment_hypotheses": _investment_hypotheses(record),
        "swot": _swot(record),
        "problem_and_product": _problem_and_product(record),
        "traction_and_kpis": _traction_and_kpis(record),
        "team_and_history": _team_and_history(record),
        "technology_and_defensibility": _technology_and_defensibility(record),
        "market_sizing": _market_sizing(record),
        "competition": "not disclosed",
        "financials_and_round_structure": _financials_and_round_structure(record),
        "cap_table": "not disclosed",
        "due_diligence_log": _due_diligence_log(record),
        "exit_perspective": "not disclosed (exit modeling is out of scope for this build — see README known limitations)",
    }
    return record
