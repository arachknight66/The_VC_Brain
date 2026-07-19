"""Multi-reasoning Investor Chat Agent.

Unlike the single-shot axis/trust agents, this agent reasons in several
explicit passes -- each a separate LLM call -- and returns every
intermediate step so the frontend can visibly show the agent "thinking"
through the evidence before it lands on a plain-English summary a busy
investor can read in a few seconds.

Grounded only in the record's already-computed evidence (axis_scores,
trust_claims, build_evidence, memo, adversarial_view) and explicitly
instructed not to introduce new facts -- same citation-only discipline as
memo_agent / adversarial_agent. Never collapses to a "yes/no" verdict: the
final pass and every follow-up answer present the balanced picture and
explicitly decline to recommend, consistent with the project's core design
principle (scores, evidence, confidence -- a human makes the call).
"""
from __future__ import annotations

import time

from memory.models import FounderRecord
from utils.openai_client import chat

GROUNDING_RULE = (
    "Use ONLY the facts given below -- do not introduce any new numbers, names, or claims. "
    "Write in plain, jargon-free English a busy investor could read in a few seconds. "
    "Never give a yes/no investment recommendation -- if asked for one, present the scores, "
    "evidence, and confidence instead and explain that the call is the investor's to make."
)


def _is_stub_text(text: str) -> bool:
    return not text or "LLM unavailable (stub mode)" in text or text.startswith("[stub response")


def _evidence_summary(record: FounderRecord) -> str:
    """Plain-text dump of the grounded facts every reasoning pass may use."""
    axis_lines = [f"- {name}: {axis.rating}, {axis.score:.0f}/100, trend {axis.trend}" for name, axis in record.axis_scores.items()]
    claim_lines = []
    for c in record.trust_claims:
        flag = " (CONTRADICTED)" if c.contradiction_flag else ""
        claim_lines.append(f'- "{c.claim_text}" -> {c.evidence_category}, confidence {c.confidence:.2f}{flag}')
    hypotheses = record.memo.get("investment_hypotheses", []) if record.memo else []
    risks = record.adversarial_view.get("key_risks", []) if record.adversarial_view else []
    red_flags = record.adversarial_view.get("unresolved_red_flags", []) if record.adversarial_view else []
    fs = record.founder_score
    basis_note = " -- based on a lower-confidence public-footprint fallback, not track record" if fs.confidence_basis == "public_footprint_fallback" else ""

    return f"""Company: {record.company_name}
Founder: {record.name}
Founder Score: {fs.value:.0f}/100 ({fs.trend}, {fs.confidence:.0%} confidence{basis_note})
Build evidence tier: {record.build_evidence.tier}

Axis scores:
{chr(10).join(axis_lines) or "(none computed)"}

Trust claims extracted from the pitch:
{chr(10).join(claim_lines) or "(none extracted)"}

Bull-case hypotheses (from the investment memo):
{chr(10).join(f"- {h}" for h in hypotheses) or "(none)"}

Bear-case risks (from the independent adversarial review):
{chr(10).join(f"- {r}" for r in risks) or "(none)"}

Unresolved red flags:
{chr(10).join(f"- {r}" for r in red_flags) or "(none)"}"""


def _stub_evidence_digest(record: FounderRecord) -> str:
    n_claims = len(record.trust_claims)
    axis_bits = ", ".join(f"{k} {v.score:.0f}/100" for k, v in record.axis_scores.items()) or "no axis scores yet"
    return f"[stub mode] {record.company_name} has {n_claims} deck claim(s) on file, a build-evidence status of '{record.build_evidence.tier}', and {axis_bits}."


def _stub_bull_take(record: FounderRecord) -> str:
    hyps = record.memo.get("investment_hypotheses", []) if record.memo else []
    if hyps:
        return "[stub mode] The strongest case on file: " + " ".join(str(h) for h in hyps[:2])
    return "[stub mode] No strong bull case is currently on file for this company."


def _stub_bear_take(record: FounderRecord) -> str:
    risks = record.adversarial_view.get("key_risks", []) if record.adversarial_view else []
    if risks:
        return "[stub mode] The main risks on file: " + " ".join(str(r) for r in risks[:2])
    return "[stub mode] No major risks are currently flagged for this company."


def _stub_plain_summary(record: FounderRecord) -> str:
    fs = record.founder_score
    basis = " (a lower-confidence public-footprint fallback, not track record)" if fs.confidence_basis == "public_footprint_fallback" else ""
    return (
        f"[stub mode] {record.company_name} currently scores {fs.value:.0f}/100 with {fs.confidence:.0%} "
        f"confidence{basis}. Build evidence is '{record.build_evidence.tier}'. This is a placeholder summary "
        "generated without a live LLM call -- rerun with a working OPENAI_API_KEY for a real briefing."
    )


def _run_step(system_extra: str, user_prompt: str, stub_fallback: str) -> tuple[str, float]:
    start = time.monotonic()
    text = chat(f"{GROUNDING_RULE} {system_extra}", user_prompt, temperature=0.3)
    if _is_stub_text(text):
        text = stub_fallback
    return text, round(time.monotonic() - start, 2)


def generate_briefing(record: FounderRecord) -> dict:
    """Runs the 4-pass reasoning chain and returns every step plus the final summary."""
    evidence = _evidence_summary(record)
    steps: list[dict] = []

    digest_text, digest_elapsed = _run_step(
        "Step 1: Read the evidence and describe, in one short paragraph, what data actually exists for "
        "this company (scores, claims, build evidence) -- no opinion yet, just what's there.",
        evidence,
        _stub_evidence_digest(record),
    )
    steps.append({"label": "Reading the evidence", "content": digest_text, "elapsed": digest_elapsed})

    bull_text, bull_elapsed = _run_step(
        "Step 2: Now explain, in plain English, the strongest reasons someone might get excited about "
        "this company -- based only on the bull-case hypotheses given.",
        evidence,
        _stub_bull_take(record),
    )
    steps.append({"label": "Weighing the upside", "content": bull_text, "elapsed": bull_elapsed})

    bear_text, bear_elapsed = _run_step(
        "Step 3: Now explain, in plain English, the biggest reasons for caution -- based only on the "
        "bear-case risks and red flags given.",
        evidence,
        _stub_bear_take(record),
    )
    steps.append({"label": "Weighing the risks", "content": bear_text, "elapsed": bear_elapsed})

    synthesis_prompt = (
        f"{evidence}\n\nUpside summary from step 2:\n{bull_text}\n\nRisk summary from step 3:\n{bear_text}"
    )
    summary_text, summary_elapsed = _run_step(
        "Step 4: Combine the above into a single short summary (4-6 sentences) a busy investor could read "
        "in 15 seconds. Mention the Founder Score and its confidence level in plain terms. Do NOT give a "
        "yes/no recommendation -- present the balanced picture and let the investor decide.",
        synthesis_prompt,
        _stub_plain_summary(record),
    )
    steps.append({"label": "Plain-English summary", "content": summary_text, "elapsed": summary_elapsed})

    return {"steps": steps, "summary": summary_text}


def answer_followup(record: FounderRecord, briefing_steps: list[dict], question: str) -> str:
    """Answers one free-text investor follow-up, grounded in the same evidence plus the prior briefing."""
    evidence = _evidence_summary(record)
    briefing_text = "\n".join(f"{s.get('label', '')}: {s.get('content', '')}" for s in briefing_steps)
    user_prompt = f"{evidence}\n\nPrior briefing already given to the investor:\n{briefing_text}\n\nInvestor question: {question}"

    text = chat(
        f"{GROUNDING_RULE} You already gave the investor the briefing above. Answer their follow-up "
        "question in 1-3 plain-English sentences, using only the same facts.",
        user_prompt,
        temperature=0.3,
    )
    if _is_stub_text(text):
        return (
            "[stub mode] I can't reach the LLM right now, so I can't answer follow-up questions live. "
            "Here's what's already grounded: " + (briefing_steps[-1]["content"] if briefing_steps else "no briefing generated yet.")
        )
    return text
