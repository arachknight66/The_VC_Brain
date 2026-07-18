"""Unit tests for individual agent logic (build.md Section 10 steps 5-11)."""
from __future__ import annotations

import os

import pytest

from agents import (
    build_evidence_agent,
    cold_start_agent,
    entity_resolution_agent,
    sourcing_agent,
    thesis_matching_agent,
    trust_score_agent,
)
from memory.models import FounderRecord
from memory.scoring import compute_founder_score

SYNTHETIC_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_founders")


def load(filename: str) -> FounderRecord:
    return sourcing_agent.load_from_synthetic(os.path.join(SYNTHETIC_DIR, filename))


def test_load_all_synthetic_profiles_returns_six():
    records = sourcing_agent.load_all_synthetic_profiles(SYNTHETIC_DIR)
    assert len(records) == 6
    names = {r.company_name for r in records}
    assert names == {
        "Ridgeline Dev Tools",
        "Ledgerly",
        "Nimbus Health AI",
        "Petra Carbon",
        "Flowbench",
        "Loopstack",
    }


def test_entity_resolution_flags_clear_mismatch():
    record = FounderRecord(
        name="Completely Different Person",
        company_name="Test Co",
        source_channel="inbound",
        raw_inputs={"github_handle": "zzz-unrelated-handle-999"},
    )
    entity_resolution_agent.run(record)
    assert record.entity_resolution_confidence is not None
    assert record.entity_resolution_confidence < 0.55


def test_entity_resolution_no_handles_is_not_applicable():
    record = FounderRecord(name="Someone", company_name="Test Co", source_channel="inbound", raw_inputs={})
    entity_resolution_agent.run(record)
    assert record.entity_resolution_confidence is None


def test_thesis_matching_passes_default_thesis_profiles():
    for filename in os.listdir(SYNTHETIC_DIR):
        record = load(filename)
        thesis_matching_agent.run(record)
        assert record.screened_out is False, f"{record.company_name} unexpectedly screened out: {record.screened_out_reason}"


def test_thesis_matching_screens_out_off_thesis_profile():
    record = FounderRecord(
        name="Off Thesis Founder",
        company_name="Crust & Crumb Bakery Chain",
        source_channel="inbound",
        raw_inputs={"sector": "brick-and-mortar bakery", "stage": "growth", "geography": "us"},
    )
    thesis_matching_agent.run(record)
    assert record.screened_out is True
    assert "sector" in record.screened_out_reason


def test_build_evidence_epsilon_pair_resolves_differently():
    epsilon_a = load("founder_05_epsilon_a_buildcheck.json")
    epsilon_b = load("founder_06_epsilon_b_buildcheck.json")

    build_evidence_agent.run(epsilon_a)
    build_evidence_agent.run(epsilon_b)

    assert epsilon_a.build_evidence.tier == "verified_working"
    assert epsilon_b.build_evidence.tier != "verified_working"
    assert len(epsilon_a.build_evidence.evidence_log) > 0
    assert len(epsilon_b.build_evidence.evidence_log) > 0


def test_build_evidence_not_applicable_when_no_build_claim():
    alpha = load("founder_01_alpha.json")
    build_evidence_agent.run(alpha)
    assert alpha.build_evidence.tier == "not_applicable"


def test_cold_start_triggers_for_delta():
    delta = load("founder_04_delta_coldstart.json")
    assert cold_start_agent._is_cold_start(delta.raw_inputs) is True
    cold_start_agent.run(delta)
    assert delta.founder_score.confidence_basis == "public_footprint_fallback"


def test_cold_start_does_not_trigger_for_alpha():
    alpha = load("founder_01_alpha.json")
    assert cold_start_agent._is_cold_start(alpha.raw_inputs) is False
    cold_start_agent.run(alpha)
    assert alpha.founder_score.confidence_basis is None


def test_trust_score_never_fabricates_a_source():
    record = FounderRecord(
        name="Nobody Nowhere",
        company_name="Totally Fictional Co That Does Not Exist Anywhere Xyzzy123",
        source_channel="inbound",
        raw_inputs={"deck_text": "We have $999,999 in ARR and 12,345 paying customers."},
    )
    trust_score_agent.run(record)
    for claim in record.trust_claims:
        if claim.evidence_category == "unverifiable":
            assert claim.source is None


def test_founder_score_is_bounded_and_weighted():
    record = load("founder_01_alpha.json")
    compute_founder_score(record)
    assert 0.0 <= record.founder_score.value <= 100.0
    assert 0.0 <= record.founder_score.confidence <= 1.0


def test_founder_score_confidence_capped_for_cold_start():
    record = load("founder_04_delta_coldstart.json")
    cold_start_agent.run(record)
    compute_founder_score(record)
    assert record.founder_score.confidence <= 0.5
