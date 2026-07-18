"""Genuinely independent Adversarial Agent (build.md Section 5.7).

Critical constraint: this agent must never see the memo agent's generated
text or reasoning — only the same raw evidence (trust_claims, axis_scores,
build_evidence, raw_inputs) the memo agent had access to. Independence is
enforced structurally, not just by convention: `_evidence_bundle()` below
builds a redacted view of the record that excludes `record.memo` entirely,
and every function in this module only ever touches that bundle.
"""
from __future__ import annotations

from agents.base import agent_stage
from memory.models import FounderRecord
from utils.openai_client import chat_json

SYSTEM_PROMPT = """You are an adversarial due-diligence analyst. Your sole job is to construct the \
strongest possible case AGAINST investing in this company, using ONLY the evidence provided below — \
you have not seen and must not assume any bull-case narrative. Be maximally skeptical: weight \
contradicted claims and unverifiable claims heavily, question weak axis scores, treat an \
"unverifiable" or "verified_submitted" build-evidence tier as a real red flag rather than benefit of \
the doubt, and look for patterns of overstatement (strong language paired with weak evidence).

Respond ONLY with a JSON object: {"bear_case_summary": "<2-3 sentence thesis for why NOT to invest>", \
"key_risks": ["risk 1", "risk 2", ...], "unresolved_red_flags": ["red flag citing specific evidence", \
...], "what_would_change_my_mind": "<1-2 sentences: what evidence would most weaken this bear case>"}"""


def _evidence_bundle(record: FounderRecord) -> dict:
    """Redacted view of the record: raw evidence only, never record.memo."""
    return {
        "company_name": record.company_name,
        "raw_inputs": record.raw_inputs,
        "axis_scores": {k: v.to_dict() for k, v in record.axis_scores.items()},
        "trust_claims": [c.to_dict() for c in record.trust_claims],
        "build_evidence": record.build_evidence.to_dict(),
        "entity_resolution_confidence": record.entity_resolution_confidence,
    }


def _stub_bear_case(bundle: dict) -> dict:
    """Offline fallback — used only when the LLM is unavailable. Deterministic,
    built from the same redacted evidence bundle, never from the memo.
    """
    risks: list[str] = []
    red_flags: list[str] = []

    for claim in bundle["trust_claims"]:
        if claim["contradiction_flag"]:
            red_flags.append(f'Contradicted claim: "{claim["claim_text"]}" (source: {claim["source"] or "none"})')
        elif claim["evidence_category"] == "unverifiable":
            risks.append(f'Unverified claim with no independent corroboration: "{claim["claim_text"]}"')

    for axis_name, axis in bundle["axis_scores"].items():
        if axis.get("score", 100) < 55:
            risks.append(f"{axis_name} axis scored weak ({axis.get('score', 0):.0f}/100): {axis.get('rating')}")

    be = bundle["build_evidence"]
    if be["tier"] == "unverifiable":
        red_flags.append("Build claim could not be independently corroborated by any signal checked.")
    elif be["tier"] == "verified_submitted":
        risks.append("Only a hackathon submission was confirmed — no live working artifact found.")

    conf = bundle.get("entity_resolution_confidence")
    if conf is not None and conf < 0.55:
        red_flags.append(f"Entity resolution confidence is low ({conf:.2f}) — deck identity may not match public handles.")

    if not risks and not red_flags:
        risks.append("No strong red flags surfaced by current evidence, but evidence coverage itself is thin — treat scores as provisional.")

    return {
        "bear_case_summary": (
            "[stub mode] Evidence-only bear case assembled without a live LLM call: "
            "see key_risks and unresolved_red_flags for the specific unresolved items."
        ),
        "key_risks": risks,
        "unresolved_red_flags": red_flags or ["None identified from current evidence."],
        "what_would_change_my_mind": "Independent corroboration of currently unverifiable claims and build evidence.",
    }


@agent_stage("adversarial_review")
def run(record: FounderRecord) -> FounderRecord:
    bundle = _evidence_bundle(record)
    data = chat_json(SYSTEM_PROMPT, str(bundle))

    if not data or data.get("_stub"):
        data = _stub_bear_case(bundle)

    record.adversarial_view = {
        "bear_case_summary": data.get("bear_case_summary", ""),
        "key_risks": data.get("key_risks", []),
        "unresolved_red_flags": data.get("unresolved_red_flags", []),
        "what_would_change_my_mind": data.get("what_would_change_my_mind", ""),
    }
    return record
