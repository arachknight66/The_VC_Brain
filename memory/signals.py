"""Persistent raw sourcing signals emitted by Stage 0 scanners."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

from memory.models import new_id, now_iso


@dataclass
class Signal:
    source: str
    title: str
    source_url: str
    summary: str
    query: str
    score: float = 0.0
    observed_at: str = field(default_factory=now_iso)
    external_id: str = ""
    raw_payload: dict[str, Any] = field(default_factory=dict)
    status: str = "raw"
    signal_id: str = field(default_factory=new_id)

    def to_dict(self) -> dict:
        return asdict(self)

    @staticmethod
    def from_dict(data: dict) -> "Signal":
        return Signal(**data)
