from __future__ import annotations

from memory.signal_store import SignalStore
from memory.signals import Signal
from memory.models import FounderRecord, TrustClaim
from memory.store import FounderStore
from scanners import github, web
from scanners.orchestrator import run_scanners


class FakeResponse:
    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return {
            "items": [
                {
                    "id": 42,
                    "full_name": "builder/agent-stack",
                    "html_url": "https://github.com/builder/agent-stack",
                    "description": "Infrastructure for reliable agents",
                    "stargazers_count": 210,
                    "forks_count": 18,
                    "language": "Python",
                    "topics": ["agents"],
                    "owner": {"login": "builder"},
                    "created_at": "2026-01-01T00:00:00Z",
                    "pushed_at": "2026-07-18T00:00:00Z",
                }
            ]
        }


def test_github_scanner_normalizes_public_api(monkeypatch):
    monkeypatch.setattr(github.requests, "get", lambda *args, **kwargs: FakeResponse())
    signals = github.scan("agent infrastructure", max_results=3)
    assert len(signals) == 1
    assert signals[0].source == "github"
    assert signals[0].raw_payload["stars"] == 210
    assert signals[0].score > 0


def test_web_scanner_enforces_requested_public_domain(monkeypatch):
    monkeypatch.setattr(
        web,
        "search",
        lambda *args, **kwargs: [
            {
                "title": "Founder profile",
                "url": "https://www.linkedin.com/in/founder",
                "content": "Founder at Example",
                "score": 0.91,
            },
            {"title": "Noise", "url": "https://example.com", "content": "Ignore", "score": 1},
        ],
    )
    signals = web.scan("linkedin", "Example founder")
    assert [signal.source_url for signal in signals] == ["https://www.linkedin.com/in/founder"]
    assert signals[0].score == 91


def test_orchestrator_persists_and_deduplicates(monkeypatch, tmp_path):
    signal = Signal(
        source="github",
        external_id="repo-1",
        title="Repository",
        source_url="https://github.com/example/repo",
        summary="A public signal",
        query="infra",
        score=84,
    )
    monkeypatch.setattr(github, "scan", lambda *args, **kwargs: [signal])
    store = SignalStore(str(tmp_path / "signals.db"))
    run_scanners("infra", ["github"], store=store)
    run_scanners("infra", ["github"], store=store)
    assert store.count_by_source() == {"github": 1}
    assert store.list()[0].external_id == "repo-1"


def test_pitch_text_validation():
    from agents.sourcing_agent import extract_pitch_text

    assert extract_pitch_text("pitch.txt", "text/plain", b"Clear company pitch") == "Clear company pitch"


def test_dashboard_summary_uses_persisted_workflow_metrics(tmp_path, monkeypatch):
    import api.routes as routes

    founder_store = FounderStore(str(tmp_path / "dashboard.db"))
    signal_store = SignalStore(founder_store.db_path)
    record = FounderRecord(name="A Founder", company_name="A Company", source_channel="inbound")
    record.founder_score.value = 82
    record.founder_score.confidence = 0.8
    record.memo = {"company_snapshot": "Snapshot"}
    record.build_evidence.tier = "verified_working"
    record.trust_claims = [
        TrustClaim("Verified claim", confidence=0.9, evidence_category="known_verified"),
        TrustClaim("Open claim", confidence=0.3, evidence_category="unverifiable"),
    ]
    record.timing.elapsed_seconds = 12.5
    founder_store.upsert(record)
    signal_store.upsert_many(
        [Signal(source="github", external_id="one", title="Signal", source_url="https://github.com/a/b", summary="Summary", query="infra")]
    )
    monkeypatch.setattr(routes, "_store", founder_store)
    monkeypatch.setattr(routes, "_signal_store", signal_store)

    summary = routes.get_dashboard_summary()
    assert summary["founder_records"] == 1
    assert summary["raw_signals"] == 1
    assert summary["memo_ready"] == 1
    assert summary["high_confidence_scores"] == 1
    assert summary["verified_claims"] == 1
    assert summary["unverified_claims"] == 1
