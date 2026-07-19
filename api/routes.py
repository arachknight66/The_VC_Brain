"""Minimal FastAPI endpoints (build.md Section 6)."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents.sourcing_agent import create_from_inbound
from memory.store import FounderStore
from run_demo import run_pipeline

router = APIRouter()
_store = FounderStore()


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


@router.post("/founders/inbound")
def submit_inbound_application(payload: InboundApplicationRequest) -> dict:
    extra = payload.model_dump(exclude={"name", "company_name", "deck_text"}, exclude_none=True)
    record = create_from_inbound(payload.name, payload.company_name, payload.deck_text, **extra)
    run_pipeline(record, _store)
    return record.to_dict()


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
