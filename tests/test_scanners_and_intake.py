from __future__ import annotations

from memory.signal_store import SignalStore
from memory.signals import Signal
from memory.models import FounderRecord, TrustClaim
from memory.store import FounderStore
from scanners import accelerators, arxiv, github, web
from scanners.orchestrator import SUPPORTED_SOURCES, run_scanners


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


def test_orchestrator_preview_does_not_persist(monkeypatch, tmp_path):
    signal = Signal(
        source="github",
        external_id="preview-1",
        title="Preview Repository",
        source_url="https://github.com/example/preview",
        summary="Review before persistence",
        query="infra",
        score=72,
    )
    monkeypatch.setattr(github, "scan", lambda *args, **kwargs: [signal])
    store = SignalStore(str(tmp_path / "signals.db"))
    result = run_scanners("infra", ["github"], store=store, persist=False)
    assert len(result.signals) == 1
    assert store.count_by_source() == {}


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


class FakeArxivResponse:
    def __init__(self, xml_text: str) -> None:
        self.text = xml_text

    def raise_for_status(self) -> None:
        return None


ARXIV_SAMPLE_XML = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2602.01234v1</id>
    <title>Scalable Agent Infrastructure for Venture Intelligence</title>
    <summary>We present an auditable multi-agent pipeline for investment memo synthesis.</summary>
    <published>2026-02-15T10:00:00Z</published>
    <updated>2026-02-15T10:00:00Z</updated>
    <author><name>Dr. Jane Doe</name></author>
    <author><name>Alex Smith</name></author>
    <link rel="alternate" href="https://arxiv.org/abs/2602.01234" type="text/html"/>
    <category term="cs.AI"/>
    <category term="cs.SE"/>
  </entry>
</feed>
"""


def test_arxiv_scanner_normalizes_public_api(monkeypatch):
    monkeypatch.setattr(arxiv.requests, "get", lambda *args, **kwargs: FakeArxivResponse(ARXIV_SAMPLE_XML))
    signals = arxiv.scan("agent infrastructure", max_results=3)
    assert len(signals) == 1
    signal = signals[0]
    assert signal.source == "arxiv"
    assert signal.external_id == "http://arxiv.org/abs/2602.01234v1"
    assert signal.title == "Scalable Agent Infrastructure for Venture Intelligence"
    assert signal.source_url == "https://arxiv.org/abs/2602.01234"
    assert "auditable multi-agent pipeline" in signal.summary
    assert signal.raw_payload["authors"] == ["Dr. Jane Doe", "Alex Smith"]
    assert signal.raw_payload["categories"] == ["cs.AI", "cs.SE"]
    assert signal.score > 0


def test_producthunt_scan_enforces_domain(monkeypatch):
    monkeypatch.setattr(
        web,
        "search",
        lambda *args, **kwargs: [
            {
                "title": "Product Launch",
                "url": "https://www.producthunt.com/posts/flowbench",
                "content": "Collaborative pipeline debugger",
                "score": 0.88,
            },
            {"title": "Noise", "url": "https://other.com/flowbench", "content": "Ignore", "score": 0.99},
        ],
    )
    signals = web.scan("producthunt", "Flowbench")
    assert [signal.source_url for signal in signals] == ["https://www.producthunt.com/posts/flowbench"]
    assert signals[0].source == "producthunt"
    assert signals[0].score == 88.0


def test_accelerator_scanner_matches_known_company():
    matched = accelerators.scan("Flowbench")
    assert len(matched) >= 1
    signal = matched[0]
    assert signal.source == "accelerator"
    assert signal.raw_payload["company"] == "Flowbench"
    assert signal.raw_payload["accelerator"] == "Y Combinator"
    assert signal.raw_payload["batch"] == "W2025"
    assert signal.score >= 90.0

    unmatched = accelerators.scan("unrelated-xyz-random-query")
    assert unmatched == []


def test_orchestrator_supports_all_sources(monkeypatch, tmp_path):
    assert len(SUPPORTED_SOURCES) >= 7
    for src in ("github", "arxiv", "producthunt", "accelerator", "x", "substack", "devpost", "linkedin"):
        assert src in SUPPORTED_SOURCES

    mock_signal = Signal(
        source="test",
        external_id="test-1",
        title="Test Signal",
        source_url="https://test.local/1",
        summary="Test summary",
        query="query",
        score=75.0,
    )
    monkeypatch.setattr(github, "scan", lambda *args, **kwargs: [mock_signal])
    monkeypatch.setattr(arxiv, "scan", lambda *args, **kwargs: [mock_signal])
    monkeypatch.setattr(accelerators, "scan", lambda *args, **kwargs: [mock_signal])
    monkeypatch.setattr(web, "scan", lambda *args, **kwargs: [mock_signal])

    store = SignalStore(str(tmp_path / "signals_all.db"))
    run = run_scanners("infra", list(SUPPORTED_SOURCES), store=store, persist=False)
    assert len(run.signals) == len(SUPPORTED_SOURCES)
    assert run.errors == {}

