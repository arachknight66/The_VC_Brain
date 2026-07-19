"""PRIORITY DIFFERENTIATOR: verifies whether a founder actually built
something, independent of a public GitHub repo (build.md Section 5.3).

Trigger condition: raw_inputs includes a build claim (claimed_hackathon or
claimed_demo_url) but the standard GitHub signal is empty/thin.

Signal checks run in priority order and stop early once a high-confidence
signal (a live, working URL or a dated demo video) is found. Every check
performed — including negative results — is logged to evidence_log; this
transparency ("here's everywhere we looked") is itself the demo artifact.
"""
from __future__ import annotations

import requests

from agents.base import agent_stage
from memory.models import BuildEvidence, BuildEvidenceLogEntry, FounderRecord
from utils.tavily_client import search

MIN_CONTENT_BYTES = 500  # below this, treat a 200 response as a placeholder/parked page


def _has_build_claim(raw: dict) -> bool:
    return bool(raw.get("claimed_hackathon") or raw.get("claimed_demo_url"))


def _github_signal_is_thin(raw: dict) -> bool:
    return not raw.get("github_handle")


def _result_text(result: dict) -> str:
    return f"{result.get('title', '')} {result.get('content', '')} {result.get('url', '')}".lower()


def _find_corroborating_result(results: list[dict], needles: list[str]) -> dict | None:
    """Tavily's OR-based search returns loosely-relevant results even for
    fictional companies/names — a non-empty result list is NOT evidence on
    its own. Only count a result as corroboration if it actually mentions
    the founder/company by name.
    """
    lowered_needles = [n.lower() for n in needles if n and len(n) >= 3]
    for result in results:
        text = _result_text(result)
        if any(needle in text for needle in lowered_needles):
            return result
    return None


def _check_hackathon_platform(founder_name: str, company_name: str, claimed_hackathon: str | None) -> BuildEvidenceLogEntry:
    hackathon_clause = f' OR "{claimed_hackathon}" submission' if claimed_hackathon else ""
    query = f'"{founder_name}" OR "{company_name}" site:devpost.com OR site:dorahacks.io{hackathon_clause}'
    results = search(query, max_results=5)
    match = _find_corroborating_result(results, [company_name, founder_name])
    if match:
        return BuildEvidenceLogEntry(
            signal="hackathon_platform",
            found=True,
            detail=f"Submission match: {match.get('title', 'untitled')} — {(match.get('content') or '')[:200]}",
            source_url=match.get("url"),
        )
    detail = f"No Devpost/DoraHacks submission naming '{founder_name}' or '{company_name}' found"
    if results:
        detail += f" ({len(results)} loosely-related search results returned, none matched by name)"
    return BuildEvidenceLogEntry(signal="hackathon_platform", found=False, detail=detail, source_url=None)


def _check_live_url(claimed_demo_url: str) -> BuildEvidenceLogEntry:
    try:
        response = requests.get(claimed_demo_url, timeout=5, headers={"User-Agent": "VCBrain-BuildEvidenceAgent/1.0"})
        content_length = len(response.content or b"")
        if response.status_code == 200 and content_length >= MIN_CONTENT_BYTES:
            return BuildEvidenceLogEntry(
                signal="live_url",
                found=True,
                detail=f"HTTP 200, {content_length} bytes of content returned — appears to be a live, functioning page.",
                source_url=claimed_demo_url,
            )
        return BuildEvidenceLogEntry(
            signal="live_url",
            found=False,
            detail=f"HTTP {response.status_code}, {content_length} bytes — likely placeholder/parked page or non-functional.",
            source_url=claimed_demo_url,
        )
    except requests.RequestException as exc:
        return BuildEvidenceLogEntry(
            signal="live_url",
            found=False,
            detail=f"Request failed: {exc.__class__.__name__} — URL unreachable.",
            source_url=claimed_demo_url,
        )


def _check_demo_video(founder_name: str, company_name: str) -> BuildEvidenceLogEntry:
    query = f'"{founder_name}" "{company_name}" demo OR walkthrough site:youtube.com OR site:loom.com'
    results = search(query, max_results=5)
    match = _find_corroborating_result(results, [company_name, founder_name])
    if match:
        return BuildEvidenceLogEntry(
            signal="demo_video",
            found=True,
            detail=f"Demo video match: {match.get('title', 'untitled')}",
            source_url=match.get("url"),
        )
    detail = f"No YouTube/Loom demo video naming '{founder_name}' or '{company_name}' found"
    if results:
        detail += f" ({len(results)} loosely-related search results returned, none matched by name)"
    return BuildEvidenceLogEntry(signal="demo_video", found=False, detail=detail, source_url=None)


def _check_product_hunt(company_name: str) -> BuildEvidenceLogEntry:
    query = f'"{company_name}" site:producthunt.com'
    results = search(query, max_results=3)
    match = _find_corroborating_result(results, [company_name])
    if match:
        return BuildEvidenceLogEntry(
            signal="product_hunt",
            found=True,
            detail=f"Product Hunt listing match: {match.get('title', 'untitled')}",
            source_url=match.get("url"),
        )
    detail = f"No Product Hunt listing naming '{company_name}' found"
    if results:
        detail += f" ({len(results)} loosely-related search results returned, none matched by name)"
    return BuildEvidenceLogEntry(signal="product_hunt", found=False, detail=detail, source_url=None)


@agent_stage("build_evidence")
def run(record: FounderRecord) -> FounderRecord:
    raw = record.raw_inputs

    if not (_has_build_claim(raw) and _github_signal_is_thin(raw)):
        record.build_evidence = BuildEvidence(tier="not_applicable", signals_checked=[], evidence_log=[])
        return record

    signals_checked: list[str] = []
    evidence_log: list[BuildEvidenceLogEntry] = []
    hackathon_submission_confirmed = False

    # 1. Hackathon submission platform check
    signals_checked.append("hackathon_platform")
    entry = _check_hackathon_platform(record.name, record.company_name, raw.get("claimed_hackathon"))
    evidence_log.append(entry)
    hackathon_submission_confirmed = entry.found

    # 2. Live URL check (stop early: this is the single strongest signal)
    if raw.get("claimed_demo_url"):
        signals_checked.append("live_url")
        entry = _check_live_url(raw["claimed_demo_url"])
        evidence_log.append(entry)
        if entry.found:
            record.build_evidence = BuildEvidence(tier="verified_working", signals_checked=signals_checked, evidence_log=evidence_log)
            return record

    # 3. Demo video check (stop early: also a high-confidence "it exists" signal)
    signals_checked.append("demo_video")
    entry = _check_demo_video(record.name, record.company_name)
    evidence_log.append(entry)
    if entry.found:
        record.build_evidence = BuildEvidence(tier="verified_working", signals_checked=signals_checked, evidence_log=evidence_log)
        return record

    # 4. Domain/cert timestamp check — explicitly skipped (nice-to-have per spec,
    # not blocking); logged for transparency rather than silently omitted.
    evidence_log.append(
        BuildEvidenceLogEntry(
            signal="domain_cert",
            found=False,
            detail="Skipped: WHOIS/cert-issuance check deprioritized for hackathon scope (non-blocking per spec).",
            source_url=None,
        )
    )

    # 5. Product Hunt check
    signals_checked.append("product_hunt")
    entry = _check_product_hunt(record.company_name)
    evidence_log.append(entry)
    product_hunt_confirmed = entry.found

    if hackathon_submission_confirmed or product_hunt_confirmed:
        tier = "verified_submitted"
    else:
        tier = "unverifiable"

    record.build_evidence = BuildEvidence(tier=tier, signals_checked=signals_checked, evidence_log=evidence_log)
    return record
