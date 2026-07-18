"""Data classes for the FounderRecord contract (data/schema/founder_record.schema.json)."""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any, Optional


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


@dataclass
class FounderScoreHistoryEntry:
    timestamp: str
    value: float
    context: str


@dataclass
class FounderScore:
    value: float = 0.0
    trend: str = "stable"  # improving | stable | declining
    history: list[FounderScoreHistoryEntry] = field(default_factory=list)
    confidence: float = 0.0
    confidence_basis: Optional[str] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        return d

    @staticmethod
    def from_dict(d: Optional[dict]) -> "FounderScore":
        if not d:
            return FounderScore()
        history = [FounderScoreHistoryEntry(**h) for h in d.get("history", [])]
        return FounderScore(
            value=d.get("value", 0.0),
            trend=d.get("trend", "stable"),
            history=history,
            confidence=d.get("confidence", 0.0),
            confidence_basis=d.get("confidence_basis"),
        )


@dataclass
class AxisScore:
    rating: str = ""
    score: float = 0.0
    trend: str = "stable"
    rationale: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    @staticmethod
    def from_dict(d: Optional[dict]) -> "AxisScore":
        if not d:
            return AxisScore()
        return AxisScore(**d)


@dataclass
class BuildEvidenceLogEntry:
    signal: str
    found: bool
    detail: str
    source_url: Optional[str] = None


@dataclass
class BuildEvidence:
    tier: str = "not_applicable"  # verified_working | verified_submitted | unverifiable | not_applicable
    signals_checked: list[str] = field(default_factory=list)
    evidence_log: list[BuildEvidenceLogEntry] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "tier": self.tier,
            "signals_checked": self.signals_checked,
            "evidence_log": [asdict(e) for e in self.evidence_log],
        }

    @staticmethod
    def from_dict(d: Optional[dict]) -> "BuildEvidence":
        if not d:
            return BuildEvidence()
        log = [BuildEvidenceLogEntry(**e) for e in d.get("evidence_log", [])]
        return BuildEvidence(
            tier=d.get("tier", "not_applicable"),
            signals_checked=d.get("signals_checked", []),
            evidence_log=log,
        )


@dataclass
class TrustClaim:
    claim_text: str
    confidence: float = 0.0
    evidence_category: str = "unverifiable"  # known_verified | statistical_association | unverifiable
    source: Optional[str] = None
    contradiction_flag: bool = False

    def to_dict(self) -> dict:
        return asdict(self)

    @staticmethod
    def from_dict(d: dict) -> "TrustClaim":
        return TrustClaim(**d)


@dataclass
class Timing:
    signal_detected_at: Optional[str] = None
    application_triggered_at: Optional[str] = None
    memo_ready_at: Optional[str] = None
    elapsed_seconds: Optional[float] = None
    stage_timings: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)

    @staticmethod
    def from_dict(d: Optional[dict]) -> "Timing":
        if not d:
            return Timing()
        return Timing(
            signal_detected_at=d.get("signal_detected_at"),
            application_triggered_at=d.get("application_triggered_at"),
            memo_ready_at=d.get("memo_ready_at"),
            elapsed_seconds=d.get("elapsed_seconds"),
            stage_timings=d.get("stage_timings", {}),
        )


@dataclass
class FounderRecord:
    name: str
    company_name: str
    source_channel: str
    founder_id: str = field(default_factory=new_id)
    first_seen_at: str = field(default_factory=now_iso)
    last_updated_at: str = field(default_factory=now_iso)
    screened_out: bool = False
    screened_out_reason: Optional[str] = None
    entity_resolution_confidence: Optional[float] = None
    raw_inputs: dict[str, Any] = field(default_factory=dict)
    founder_score: FounderScore = field(default_factory=FounderScore)
    axis_scores: dict[str, AxisScore] = field(default_factory=dict)
    build_evidence: BuildEvidence = field(default_factory=BuildEvidence)
    trust_claims: list[TrustClaim] = field(default_factory=list)
    memo: dict[str, Any] = field(default_factory=dict)
    adversarial_view: dict[str, Any] = field(default_factory=dict)
    timing: Timing = field(default_factory=Timing)

    def touch(self) -> None:
        self.last_updated_at = now_iso()

    def to_dict(self) -> dict:
        return {
            "founder_id": self.founder_id,
            "name": self.name,
            "company_name": self.company_name,
            "source_channel": self.source_channel,
            "first_seen_at": self.first_seen_at,
            "last_updated_at": self.last_updated_at,
            "screened_out": self.screened_out,
            "screened_out_reason": self.screened_out_reason,
            "entity_resolution_confidence": self.entity_resolution_confidence,
            "raw_inputs": self.raw_inputs,
            "founder_score": self.founder_score.to_dict(),
            "axis_scores": {k: v.to_dict() for k, v in self.axis_scores.items()},
            "build_evidence": self.build_evidence.to_dict(),
            "trust_claims": [c.to_dict() for c in self.trust_claims],
            "memo": self.memo,
            "adversarial_view": self.adversarial_view,
            "timing": self.timing.to_dict(),
        }

    @staticmethod
    def from_dict(d: dict) -> "FounderRecord":
        return FounderRecord(
            founder_id=d.get("founder_id", new_id()),
            name=d["name"],
            company_name=d["company_name"],
            source_channel=d.get("source_channel", "inbound"),
            first_seen_at=d.get("first_seen_at", now_iso()),
            last_updated_at=d.get("last_updated_at", now_iso()),
            screened_out=d.get("screened_out", False),
            screened_out_reason=d.get("screened_out_reason"),
            entity_resolution_confidence=d.get("entity_resolution_confidence"),
            raw_inputs=d.get("raw_inputs", {}),
            founder_score=FounderScore.from_dict(d.get("founder_score")),
            axis_scores={k: AxisScore.from_dict(v) for k, v in d.get("axis_scores", {}).items()},
            build_evidence=BuildEvidence.from_dict(d.get("build_evidence")),
            trust_claims=[TrustClaim.from_dict(c) for c in d.get("trust_claims", [])],
            memo=d.get("memo", {}),
            adversarial_view=d.get("adversarial_view", {}),
            timing=Timing.from_dict(d.get("timing")),
        )
