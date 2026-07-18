"""Per-claim Trust Score: extracts discrete factual claims from the deck
text and attempts to verify each one independently via Tavily, rather than
producing a single collapsed company-level trust score (build.md Section
5.6 / differentiator #2).

Never fabricates a source: if nothing relevant is found, the claim stays
`unverifiable` with `source: null` — that is a first-class, honest outcome,
not a failure state.
"""
from __future__ import annotations

import re

from agents.base import agent_stage
from memory.models import FounderRecord, TrustClaim
from utils.openai_client import chat_json
from utils.tavily_client import search

MAX_CLAIMS = 6  # cap for demo speed / API-call budget

EXTRACTION_SYSTEM_PROMPT = """You extract discrete, checkable factual claims from a startup pitch \
deck. List every specific claim about traction, revenue, team background, or market size — anything \
with a number, a named partner/investor/employer, or a specific verifiable fact. Skip vague marketing \
language with nothing concrete to check.

Respond ONLY with a JSON object: {"claims": ["claim text 1", "claim text 2", ...]}"""

CLASSIFY_SYSTEM_PROMPT = """You are a due-diligence analyst verifying ONE factual claim from a \
startup pitch deck against retrieved web search evidence. Classify it as exactly one of: \
"known_verified" (evidence directly confirms it), "statistical_association" (plausible and \
consistent with retrieved evidence, but not a direct confirmation), or "unverifiable" (no relevant \
evidence was retrieved). Set contradiction_flag to true ONLY if the retrieved evidence directly \
conflicts with the claim. Never invent a source — if the evidence provided is empty or irrelevant to \
this specific claim, classify as unverifiable with source null.

Respond ONLY with a JSON object: {"evidence_category": "known_verified"|"statistical_association"| \
"unverifiable", "confidence": <0-1 number>, "source": <url string or null>, "contradiction_flag": \
<true|false>}"""

_CLAIM_SENTENCE_PATTERN = re.compile(
    r"(\$[\d,.]+\s?[kKmMbB]?|\b\d+([.,]\d+)?\s?%|\b\d+([.,]\d+)?\s?(million|billion|thousand|k|m|b)\b|\bMRR\b|\bARR\b)",
    re.IGNORECASE,
)


def _extract_claims_heuristic(deck_text: str) -> list[str]:
    """Offline fallback claim extraction: sentences containing a number,
    dollar amount, or percentage — used only when the LLM is unavailable.
    """
    sentences = re.split(r"(?<=[.!?])\s+", deck_text)
    return [s.strip() for s in sentences if s.strip() and _CLAIM_SENTENCE_PATTERN.search(s)]


def _extract_claims(deck_text: str) -> list[str]:
    data = chat_json(EXTRACTION_SYSTEM_PROMPT, deck_text)
    claims = data.get("claims") if data and not data.get("_stub") else None
    if claims and isinstance(claims, list):
        cleaned = [c.strip() for c in claims if isinstance(c, str) and c.strip()]
        if cleaned:
            return cleaned[:MAX_CLAIMS]
    return _extract_claims_heuristic(deck_text)[:MAX_CLAIMS]


def _result_text(result: dict) -> str:
    return f"{result.get('title', '')} {result.get('content', '')} {result.get('url', '')}".lower()


def _classify_claim_llm(claim_text: str, company_name: str, results: list[dict]) -> dict | None:
    if results:
        evidence_text = "\n".join(
            f"- {r.get('title', 'untitled')}: {(r.get('content') or '')[:300]} (source: {r.get('url')})"
            for r in results
        )
    else:
        evidence_text = "(no search results retrieved)"

    user_prompt = f"Company: {company_name}\nClaim: {claim_text}\n\nRetrieved evidence:\n{evidence_text}"
    data = chat_json(CLASSIFY_SYSTEM_PROMPT, user_prompt)
    if not data or data.get("_stub"):
        return None
    return data


def _classify_claim_heuristic(results: list[dict], company_name: str) -> dict:
    """Offline fallback classifier — used only when the LLM is unavailable.
    Deliberately conservative: a raw non-empty Tavily result list is not
    evidence on its own (see build_evidence_agent's false-positive fix), so
    this only counts a result if it literally names the company.
    """
    matches = [r for r in results if company_name.lower() in _result_text(r)]
    if matches:
        return {
            "evidence_category": "statistical_association",
            "confidence": 0.35,
            "source": matches[0].get("url"),
            "contradiction_flag": False,
        }
    return {"evidence_category": "unverifiable", "confidence": 0.15, "source": None, "contradiction_flag": False}


@agent_stage("trust_score")
def run(record: FounderRecord) -> FounderRecord:
    deck_text = (record.raw_inputs.get("deck_text") or "").strip()
    if not deck_text:
        record.trust_claims = []
        return record

    claim_texts = _extract_claims(deck_text)
    trust_claims: list[TrustClaim] = []

    for claim_text in claim_texts:
        results = search(f'"{record.company_name}" {claim_text}', max_results=4)
        verdict = _classify_claim_llm(claim_text, record.company_name, results)
        if verdict is None:
            verdict = _classify_claim_heuristic(results, record.company_name)

        category = verdict.get("evidence_category", "unverifiable")
        if category not in ("known_verified", "statistical_association", "unverifiable"):
            category = "unverifiable"

        try:
            confidence = float(verdict.get("confidence", 0.2))
        except (TypeError, ValueError):
            confidence = 0.2
        confidence = max(0.0, min(1.0, confidence))

        source = verdict.get("source") if category != "unverifiable" else None

        trust_claims.append(
            TrustClaim(
                claim_text=claim_text,
                confidence=confidence,
                evidence_category=category,
                source=source,
                contradiction_flag=bool(verdict.get("contradiction_flag", False)),
            )
        )

    record.trust_claims = trust_claims
    return record
