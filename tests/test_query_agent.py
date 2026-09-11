"""Tests for the compound query parsing and multi-attribute search agent."""
from __future__ import annotations

import os
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from agents import query_agent, sourcing_agent
from api.main import app
from memory.models import FounderRecord, FounderScore, TrustClaim

SYNTHETIC_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_founders")


def test_parse_query_stub_mode_falls_back_to_keywords(monkeypatch):
    monkeypatch.setattr(query_agent, "chat_json", lambda *args, **kwargs: {"_stub": True})

    query = "technical founder, Berlin, AI infra, enterprise traction"
    parsed = query_agent.parse_query(query)

    assert parsed["sector"] is None
    assert parsed["geography"] is None
    assert parsed["stage"] is None
    assert parsed["technical_founder"] is None
    assert parsed["has_funding_history"] is None
    assert parsed["has_accelerator_history"] is None
    assert parsed["min_traction_signal"] is None
    assert parsed["keywords"] == [query]


def test_parse_query_structured_extraction(monkeypatch):
    mock_llm_json = {
        "sector": "developer tools",
        "geography": "US",
        "stage": "seed",
        "technical_founder": True,
        "has_funding_history": False,
        "has_accelerator_history": True,
        "min_traction_signal": True,
        "keywords": ["database", "rust"],
    }
    monkeypatch.setattr(query_agent, "chat_json", lambda *args, **kwargs: mock_llm_json)

    parsed = query_agent.parse_query("some query")
    assert parsed["sector"] == "developer tools"
    assert parsed["geography"] == "US"
    assert parsed["stage"] == "seed"
    assert parsed["technical_founder"] is True
    assert parsed["has_funding_history"] is False
    assert parsed["has_accelerator_history"] is True
    assert parsed["min_traction_signal"] is True
    assert parsed["keywords"] == ["database", "rust"]


def test_apply_filters_excludes_on_hard_filter_mismatch():
    r1 = FounderRecord(
        name="Alice",
        company_name="AlphaTech",
        source_channel="inbound",
        raw_inputs={"sector": "developer tools", "geography": "US", "stage": "seed"},
    )
    r2 = FounderRecord(
        name="Bob",
        company_name="BetaBio",
        source_channel="inbound",
        raw_inputs={"sector": "healthtech", "geography": "EU", "stage": "pre-seed"},
    )
    r3 = FounderRecord(
        name="Charlie",
        company_name="GammaFin",
        source_channel="inbound",
        raw_inputs={"sector": "fintech", "geography": "US", "stage": "seed"},
    )

    records = [r1, r2, r3]

    # Filter by sector: developer tools
    results = query_agent.apply_filters(records, {"sector": "developer tools"})
    matched_names = [r.name for r, _ in results]
    assert matched_names == ["Alice"]

    # Filter by geography: EU
    results_geo = query_agent.apply_filters(records, {"geography": "EU"})
    matched_geo = [r.name for r, _ in results_geo]
    assert matched_geo == ["Bob"]

    # Filter by stage: pre-seed
    results_stage = query_agent.apply_filters(records, {"stage": "pre-seed"})
    matched_stage = [r.name for r, _ in results_stage]
    assert matched_stage == ["Bob"]


def test_apply_filters_ranks_by_keyword_match_without_excluding():
    r1 = FounderRecord(
        name="Alice",
        company_name="Alpha Observability",
        source_channel="inbound",
        raw_inputs={
            "sector": "developer tools",
            "geography": "US",
            "deck_text": "We build deep telemetry and observability pipelines.",
        },
        founder_score=FounderScore(value=50.0),
    )
    r2 = FounderRecord(
        name="Bob",
        company_name="Beta Cloud",
        source_channel="inbound",
        raw_inputs={
            "sector": "developer tools",
            "geography": "US",
            "deck_text": "Hosting infrastructure and servers.",
        },
        founder_score=FounderScore(value=50.0),
    )

    records = [r1, r2]

    # Hard filter passes both; keyword "observability" gives r1 a boost
    filters = {
        "sector": "developer tools",
        "keywords": ["observability"],
    }
    results = query_agent.apply_filters(records, filters)

    assert len(results) == 2
    r_first, score_first = results[0]
    r_second, score_second = results[1]

    assert r_first.name == "Alice"
    assert r_second.name == "Bob"
    assert score_first > score_second


def test_apply_filters_boolean_flags():
    r1 = FounderRecord(
        name="Tech Founder",
        company_name="CodeBase",
        source_channel="inbound",
        raw_inputs={
            "sector": "developer tools",
            "github_handle": "octocat",
            "has_funding_history": False,
            "has_accelerator_history": True,
        },
        trust_claims=[TrustClaim(claim_text="Revenue verified", evidence_category="known_verified")],
    )
    r2 = FounderRecord(
        name="Non Tech Founder",
        company_name="SalesHub",
        source_channel="inbound",
        raw_inputs={
            "sector": "developer tools",
            "github_handle": None,
            "deck_text": "B2B sales distribution network.",
            "has_funding_history": True,
            "has_accelerator_history": False,
        },
    )

    records = [r1, r2]

    # Technical founder requirement
    tech_results = query_agent.apply_filters(records, {"technical_founder": True})
    assert [r.name for r, _ in tech_results] == ["Tech Founder"]

    # Non-technical founder requirement
    non_tech_results = query_agent.apply_filters(records, {"technical_founder": False})
    assert [r.name for r, _ in non_tech_results] == ["Non Tech Founder"]

    # No prior funding history
    unfunded_results = query_agent.apply_filters(records, {"has_funding_history": False})
    assert [r.name for r, _ in unfunded_results] == ["Tech Founder"]

    # Accelerator history
    accel_results = query_agent.apply_filters(records, {"has_accelerator_history": True})
    assert [r.name for r, _ in accel_results] == ["Tech Founder"]

    # Traction requirement
    traction_results = query_agent.apply_filters(records, {"min_traction_signal": True})
    assert [r.name for r, _ in traction_results] == ["Tech Founder"]


def test_run_end_to_end_against_synthetic_profiles(monkeypatch):
    records = sourcing_agent.load_all_synthetic_profiles(SYNTHETIC_DIR)
    assert len(records) == 6

    # 1. Query targeting developer tools in US with technical founder and funding
    def mock_chat_devtools(system_prompt, user_prompt):
        return {
            "sector": "developer tools",
            "geography": "US",
            "stage": "seed",
            "has_funding_history": True,
            "keywords": [],
        }

    monkeypatch.setattr(query_agent, "chat_json", mock_chat_devtools)
    results = query_agent.run("developer tools seed US with prior funding", records)

    assert len(results) >= 1
    top_founder = results[0]["founder"]
    assert top_founder["company_name"] == "Ridgeline Dev Tools"
    assert top_founder["name"] == "Priya Nandakumar"

    # 2. Query targeting healthtech
    def mock_chat_health(system_prompt, user_prompt):
        return {
            "sector": "healthtech",
            "geography": None,
            "stage": None,
            "keywords": [],
        }

    monkeypatch.setattr(query_agent, "chat_json", mock_chat_health)
    results = query_agent.run("healthtech founders", records)

    assert len(results) == 1
    assert results[0]["founder"]["company_name"] == "Nimbus Health AI"
    assert results[0]["founder"]["name"] == "Jordan Castellane"


def test_api_search_endpoint():
    client = TestClient(app)

    # Empty query must fail with 422
    resp_empty = client.post("/founders/search", json={"query": ""})
    assert resp_empty.status_code == 422

    resp_whitespace = client.post("/founders/search", json={"query": "   "})
    assert resp_whitespace.status_code == 422

    # Valid query returns 200 and schema
    resp = client.post("/founders/search", json={"query": "developer tools", "limit": 5})
    assert resp.status_code == 200
    data = resp.json()

    assert "query" in data
    assert data["query"] == "developer tools"
    assert "parsed_filters" in data
    assert "results" in data
    assert "count" in data
    assert isinstance(data["results"], list)
    assert data["count"] == len(data["results"])
    assert data["count"] <= 5
