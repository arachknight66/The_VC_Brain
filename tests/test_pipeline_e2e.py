"""End-to-end pipeline test: all 6 synthetic profiles run through the full
pipeline with no errors, matching the Definition of Done in build.md
Section 13.
"""
from __future__ import annotations

import os

import pytest

from agents import sourcing_agent
from memory.store import FounderStore
from run_demo import run_pipeline

SYNTHETIC_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_founders")


@pytest.fixture()
def store(tmp_path):
    return FounderStore(db_path=str(tmp_path / "test_vc_brain.db"))


def test_full_pipeline_runs_on_all_six_profiles_without_error(store):
    records = sourcing_agent.load_all_synthetic_profiles(SYNTHETIC_DIR)
    assert len(records) == 6

    for record in records:
        run_pipeline(record, store)
        assert record.memo, f"{record.company_name} produced an empty memo"
        assert record.adversarial_view, f"{record.company_name} produced an empty adversarial view"
        assert record.timing.memo_ready_at is not None
        assert record.timing.elapsed_seconds is not None
        for section in ("company_snapshot", "investment_hypotheses", "swot", "problem_and_product", "traction_and_kpis"):
            assert section in record.memo


def test_epsilon_pair_visibly_differs_in_build_evidence(store):
    records = {r.company_name: r for r in sourcing_agent.load_all_synthetic_profiles(SYNTHETIC_DIR)}
    for record in records.values():
        run_pipeline(record, store)

    assert records["Flowbench"].build_evidence.tier == "verified_working"
    assert records["Loopstack"].build_evidence.tier != "verified_working"


def test_pipeline_persists_all_records_to_store(store):
    records = sourcing_agent.load_all_synthetic_profiles(SYNTHETIC_DIR)
    for record in records:
        run_pipeline(record, store)

    all_stored = store.list_all()
    assert len(all_stored) == 6


def test_adversarial_view_never_reads_the_memo(store):
    """Structural check: the adversarial agent's evidence bundle never
    includes memo text, regardless of pipeline order."""
    from agents.adversarial_agent import _evidence_bundle
    from memory.models import FounderRecord

    record = FounderRecord(name="X", company_name="Y", source_channel="inbound")
    record.memo = {"company_snapshot": "this text must never leak into the adversarial view"}
    bundle = _evidence_bundle(record)

    assert "memo" not in bundle
    assert "this text must never leak into the adversarial view" not in str(bundle)
