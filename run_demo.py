#!/usr/bin/env python3
"""End-to-end demo runner (build.md Section 8).

Loads all synthetic founder profiles, runs each through the full pipeline
(Sourcing -> Entity Resolution -> Thesis Match -> Cold-Start Check ->
3-Axis Scoring -> Build Evidence -> Trust Score -> Founder Score ->
Memo -> Adversarial), persists results to SQLite, and prints a summary
table. This is what proves the pipeline works end-to-end before touching
the API/dashboard.

Usage:
    python run_demo.py            # run against the existing SQLite store
    python run_demo.py --reset    # wipe the store first, for a clean run
"""
from __future__ import annotations

import argparse
import time

from agents import (
    adversarial_agent,
    build_evidence_agent,
    cold_start_agent,
    entity_resolution_agent,
    founder_axis_agent,
    idea_vs_market_agent,
    linkedin_agent,
    market_axis_agent,
    memo_agent,
    sourcing_agent,
    thesis_matching_agent,
    trust_score_agent,
)
from memory.models import FounderRecord, now_iso
from memory.scoring import compute_founder_score
from memory.store import FounderStore
from utils import openai_client, tavily_client


def run_pipeline(record: FounderRecord, store: FounderStore) -> FounderRecord:
    linkedin_agent.run(record)
    entity_resolution_agent.run(record)
    thesis_matching_agent.run(record)

    if record.screened_out:
        print(f"  SCREENED OUT at thesis match: {record.screened_out_reason}")
        store.upsert(record, score_context="screened_out_at_thesis_match")
        return record

    cold_start_agent.run(record)
    founder_axis_agent.run(record)
    market_axis_agent.run(record)
    idea_vs_market_agent.run(record)
    build_evidence_agent.run(record)
    trust_score_agent.run(record)

    previous = store.find_by_name(record.name)
    compute_founder_score(record, previous_value=previous.founder_score.value if previous else None)

    memo_agent.run(record)
    adversarial_agent.run(record)

    record.timing.memo_ready_at = now_iso()
    record.timing.elapsed_seconds = sum(record.timing.stage_timings.values())

    store.upsert(record, score_context="run_demo pipeline run")
    return record


def print_summary(results: list[FounderRecord]) -> None:
    print("=" * 108)
    print("SUMMARY")
    print("=" * 108)
    header = f"{'Company':<22}{'Founder Score':<15}{'Founder':<9}{'Market':<9}{'Idea':<9}{'Build Evidence':<20}{'Signal->Memo':<14}"
    print(header)
    print("-" * len(header))
    for r in results:
        founder = r.axis_scores.get("founder")
        market = r.axis_scores.get("market")
        idea = r.axis_scores.get("idea_vs_market")
        elapsed = r.timing.elapsed_seconds or 0.0
        print(
            f"{r.company_name:<22}"
            f"{r.founder_score.value:<15.1f}"
            f"{(founder.score if founder else 0):<9.0f}"
            f"{(market.score if market else 0):<9.0f}"
            f"{(idea.score if idea else 0):<9.0f}"
            f"{r.build_evidence.tier:<20}"
            f"{elapsed:<14.2f}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="VC Brain end-to-end demo runner")
    parser.add_argument("--reset", action="store_true", help="Wipe the SQLite store before running")
    args = parser.parse_args()

    print("=" * 108)
    print("VC BRAIN — end-to-end demo run")
    print(f"OpenAI live: {openai_client.is_live()}    Tavily live: {tavily_client.is_live()}")
    print("=" * 108)

    store = FounderStore()
    if args.reset:
        store.reset()
        print("(SQLite store reset — starting from a clean database)\n")

    records = sourcing_agent.load_all_synthetic_profiles()
    print(f"Loaded {len(records)} synthetic founder profiles from data/synthetic_founders/\n")

    results = []
    for record in records:
        print(f"--- {record.company_name} ({record.name}) [{record.source_channel}] ---")
        t0 = time.monotonic()
        run_pipeline(record, store)
        wall_clock = time.monotonic() - t0
        print(f"  wall-clock: {wall_clock:.2f}s")
        results.append(record)
        print()

    print_summary(results)

    print()
    print("--- extra credit: live GitHub outbound signal search (topic='fintech') ---")
    live_signals = sourcing_agent.github_topic_search("fintech", max_results=3)
    if live_signals:
        for s in live_signals:
            print(f"  {s['name']}: {s['description']}")
    else:
        print("  (no live signals returned — GitHub API unreachable/rate-limited)")

    print()
    print(f"All {len(results)} founder records persisted to {store.db_path}")


if __name__ == "__main__":
    main()
