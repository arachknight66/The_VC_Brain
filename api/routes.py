"""Minimal FastAPI endpoints (build.md Section 6)."""
from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel

from agents import investor_chat_agent
from agents.sourcing_agent import MAX_PITCH_BYTES, create_from_inbound, extract_pitch_text
from memory.signal_store import SignalStore
from memory.signals import Signal
from memory.store import FounderStore
from run_demo import run_pipeline
from scanners.orchestrator import SUPPORTED_SOURCES, run_scanners

router = APIRouter()
_store = FounderStore()
_signal_store = SignalStore(_store.db_path)


class InboundApplicationRequest(BaseModel):
    name: str
    company_name: str
    deck_text: str
    sector: str | None = None
    stage: str | None = None
    geography: str | None = None
    github_handle: str | None = None
    linkedin_url: str | None = None
    claimed_hackathon: str | None = None
    claimed_demo_url: str | None = None
    twitter_handle: str | None = None
    blog_url: str | None = None
    has_funding_history: bool | None = None
    has_accelerator_history: bool | None = None


class ScannerRunRequest(BaseModel):
    query: str
    sources: list[str] = list(SUPPORTED_SOURCES)
    max_results: int = 10
    persist: bool = True


class SignalReviewRequest(BaseModel):
    signals: list[dict]
    accepted_ids: list[str]


class BriefingStepPayload(BaseModel):
    label: str
    content: str
    elapsed: float | None = None


class ChatRequest(BaseModel):
    message: str
    briefing_steps: list[BriefingStepPayload] = []


@router.post("/founders/inbound")
def submit_inbound_application(payload: InboundApplicationRequest) -> dict:
    extra = payload.model_dump(exclude={"name", "company_name", "deck_text"}, exclude_none=True)
    record = create_from_inbound(payload.name, payload.company_name, payload.deck_text, **extra)
    run_pipeline(record, _store)
    return record.to_dict()


@router.post("/founders/inbound/upload")
async def submit_pitch_upload(
    pitch: UploadFile = File(...),
    name: str = Form(..., min_length=1, max_length=160),
    company_name: str = Form(..., min_length=1, max_length=200),
    sector: str | None = Form(None),
    stage: str | None = Form(None),
    geography: str | None = Form(None),
    linkedin_url: str | None = Form(None),
    github_handle: str | None = Form(None),
) -> dict:
    """Create, enrich, analyze, and persist a founder from an uploaded pitch."""
    data = await pitch.read(MAX_PITCH_BYTES + 1)
    try:
        deck_text = extract_pitch_text(pitch.filename or "pitch", pitch.content_type, data)
    except ValueError as exc:
        status = 413 if "10 MB" in str(exc) else 400
        raise HTTPException(status_code=status, detail=str(exc)) from exc
    extra = {
        key: value
        for key, value in {
            "sector": sector,
            "stage": stage,
            "geography": geography,
            "linkedin_url": linkedin_url,
            "github_handle": github_handle,
            "pitch_filename": pitch.filename,
            "pitch_content_type": pitch.content_type,
        }.items()
        if value is not None
    }
    record = create_from_inbound(name.strip(), company_name.strip(), deck_text, **extra)
    run_pipeline(record, _store)
    return record.to_dict()


@router.get("/scanners/sources")
def list_scanner_sources() -> dict:
    return {"sources": list(SUPPORTED_SOURCES)}


@router.post("/scanners/run")
def execute_scanners(payload: ScannerRunRequest) -> dict:
    try:
        result = run_scanners(
            payload.query,
            payload.sources,
            max_results=payload.max_results,
            store=_signal_store,
            persist=payload.persist,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return result.to_dict()


@router.post("/signals/review")
def review_scanner_signals(payload: SignalReviewRequest) -> dict:
    """Persist only signals explicitly accepted during sourcing review."""
    accepted = []
    accepted_ids = set(payload.accepted_ids)
    for raw in payload.signals:
        signal = Signal.from_dict(raw)
        if signal.signal_id not in accepted_ids:
            continue
        signal.status = "accepted"
        accepted.append(signal)
    _signal_store.upsert_many(accepted)
    return {
        "accepted": len(accepted),
        "dismissed": max(0, len(payload.signals) - len(accepted)),
        "signals": [signal.to_dict() for signal in accepted],
    }


@router.get("/signals")
def list_signals(
    source: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
) -> dict:
    if source and source not in SUPPORTED_SOURCES:
        raise HTTPException(status_code=422, detail=f"Unsupported scanner source: {source}")
    signals = _signal_store.list(source=source, limit=limit)
    return {
        "signals": [signal.to_dict() for signal in signals],
        "counts": _signal_store.count_by_source(),
    }


@router.get("/dashboard/summary")
def get_dashboard_summary() -> dict:
    """Return investor-facing metrics derived from persisted workflow records."""
    founders = _store.list_all()
    total = len(founders)
    memo_ready = sum(1 for record in founders if bool(record.memo))
    high_confidence = sum(1 for record in founders if record.founder_score.confidence >= 0.75)
    verified_builds = sum(
        1 for record in founders if record.build_evidence.tier == "verified_working"
    )
    verified_claims = sum(
        1
        for record in founders
        for claim in record.trust_claims
        if claim.evidence_category == "known_verified" and not claim.contradiction_flag
    )
    unverified_claims = sum(
        1
        for record in founders
        for claim in record.trust_claims
        if claim.evidence_category == "unverifiable" or claim.contradiction_flag
    )
    memo_times = [
        record.timing.elapsed_seconds
        for record in founders
        if record.timing.elapsed_seconds is not None
    ]
    return {
        "founder_records": total,
        "active_opportunities": sum(1 for record in founders if not record.screened_out),
        "raw_signals": sum(_signal_store.count_by_source().values()),
        "memo_ready": memo_ready,
        "high_confidence_scores": high_confidence,
        "verified_builds": verified_builds,
        "verified_claims": verified_claims,
        "unverified_claims": unverified_claims,
        "average_founder_score": round(
            sum(record.founder_score.value for record in founders) / total, 1
        )
        if total
        else 0.0,
        "average_score_confidence": round(
            sum(record.founder_score.confidence for record in founders) / total, 2
        )
        if total
        else 0.0,
        "average_signal_to_memo_seconds": round(sum(memo_times) / len(memo_times), 2)
        if memo_times
        else None,
    }


@router.get("/founders")
def list_founders() -> list[dict]:
    return [r.to_dict() for r in _store.list_all()]


@router.get("/founders/{founder_id}")
def get_founder(founder_id: str) -> dict:
    record = _store.get(founder_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Founder not found")
    return record.to_dict()


@router.get("/founders/{founder_id}/memo")
def get_founder_memo(founder_id: str) -> dict:
    record = _store.get(founder_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Founder not found")
    return {"memo": record.memo, "adversarial_view": record.adversarial_view}


@router.get("/founders/{founder_id}/build-evidence")
def get_founder_build_evidence(founder_id: str) -> dict:
    record = _store.get(founder_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Founder not found")
    return record.build_evidence.to_dict()


@router.get("/founders/{founder_id}/investor-briefing")
def get_investor_briefing(founder_id: str) -> dict:
    """Runs the multi-reasoning investor chat agent's 4-pass briefing chain
    for one founder, returning every intermediate step for the frontend
    chat box to reveal progressively."""
    record = _store.get(founder_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Founder not found")
    return investor_chat_agent.generate_briefing(record)


@router.post("/founders/{founder_id}/chat")
def post_investor_chat(founder_id: str, payload: ChatRequest) -> dict:
    """Answers one free-text investor follow-up question, grounded in the
    founder's evidence plus the briefing steps already shown to the client."""
    record = _store.get(founder_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Founder not found")
    if not payload.message.strip():
        raise HTTPException(status_code=422, detail="message must not be empty")
    briefing_steps = [s.model_dump() for s in payload.briefing_steps]
    reply = investor_chat_agent.answer_followup(record, briefing_steps, payload.message.strip())
    return {"reply": reply}
