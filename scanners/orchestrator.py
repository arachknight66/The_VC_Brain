"""Runs requested scanners and persists every raw result."""
from __future__ import annotations

from dataclasses import dataclass

from memory.signal_store import SignalStore
from memory.signals import Signal
from scanners import github
from scanners import web

SUPPORTED_SOURCES = ("github", "x", "substack", "devpost", "linkedin")


@dataclass
class ScanRun:
    query: str
    requested_sources: list[str]
    signals: list[Signal]
    errors: dict[str, str]

    def to_dict(self) -> dict:
        return {
            "query": self.query,
            "requested_sources": self.requested_sources,
            "signal_count": len(self.signals),
            "signals": [signal.to_dict() for signal in self.signals],
            "errors": self.errors,
        }


def run_scanners(
    query: str,
    sources: list[str] | None = None,
    *,
    max_results: int = 10,
    store: SignalStore | None = None,
    persist: bool = True,
) -> ScanRun:
    normalized_query = query.strip()
    if not normalized_query:
        raise ValueError("Scanner query cannot be empty")
    requested = list(dict.fromkeys(source.lower() for source in (sources or SUPPORTED_SOURCES)))
    unsupported = sorted(set(requested) - set(SUPPORTED_SOURCES))
    if unsupported:
        raise ValueError(f"Unsupported scanner sources: {', '.join(unsupported)}")
    max_results = max(1, min(max_results, 25))
    signals: list[Signal] = []
    errors: dict[str, str] = {}
    for source in requested:
        try:
            found = github.scan(normalized_query, max_results=max_results) if source == "github" else web.scan(
                source, normalized_query, max_results=max_results
            )
            signals.extend(found)
        except Exception as exc:  # one external source must not abort the scan run
            errors[source] = str(exc)
    if persist:
        (store or SignalStore()).upsert_many(signals)
    return ScanRun(normalized_query, requested, signals, errors)
