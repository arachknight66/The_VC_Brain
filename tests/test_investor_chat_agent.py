"""Tests for the multi-reasoning investor chat agent."""
from __future__ import annotations

import os

from agents import (
    build_evidence_agent,
    entity_resolution_agent,
    founder_axis_agent,
    idea_vs_market_agent,
    investor_chat_agent,
    market_axis_agent,
    memo_agent,
    adversarial_agent,
    sourcing_agent,
    thesis_matching_agent,
    trust_score_agent,
)
from memory.scoring import compute_founder_score

SYNTHETIC_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_founders")


def analyzed_record():
    record = sourcing_agent.load_from_synthetic(os.path.join(SYNTHETIC_DIR, "founder_01_alpha.json"))
    entity_resolution_agent.run(record)
    thesis_matching_agent.run(record)
    founder_axis_agent.run(record)
    market_axis_agent.run(record)
    idea_vs_market_agent.run(record)
    build_evidence_agent.run(record)
    trust_score_agent.run(record)
    compute_founder_score(record)
    memo_agent.run(record)
    adversarial_agent.run(record)
    return record


def test_briefing_has_four_reasoning_steps_and_a_summary():
    record = analyzed_record()
    briefing = investor_chat_agent.generate_briefing(record)

    assert len(briefing["steps"]) == 4
    labels = [s["label"] for s in briefing["steps"]]
    assert labels == [
        "Reading the evidence",
        "Weighing the upside",
        "Weighing the risks",
        "Plain-English summary",
    ]
    assert briefing["summary"] == briefing["steps"][-1]["content"]
    for step in briefing["steps"]:
        assert step["content"]
        assert step["elapsed"] >= 0


def test_briefing_never_contains_a_yesno_verdict_string():
    record = analyzed_record()
    briefing = investor_chat_agent.generate_briefing(record)
    summary_lower = briefing["summary"].lower()
    assert "i recommend investing" not in summary_lower
    assert "you should invest" not in summary_lower


def test_answer_followup_grounds_on_prior_briefing_and_never_crashes():
    record = analyzed_record()
    briefing = investor_chat_agent.generate_briefing(record)
    reply = investor_chat_agent.answer_followup(record, briefing["steps"], "What's the biggest risk here?")
    assert isinstance(reply, str)
    assert reply.strip()


def test_evidence_summary_never_fabricates_missing_sections():
    record = sourcing_agent.load_from_synthetic(os.path.join(SYNTHETIC_DIR, "founder_04_delta_coldstart.json"))
    summary = investor_chat_agent._evidence_summary(record)
    assert "(none computed)" in summary or record.axis_scores
