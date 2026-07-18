"""Shared agent scaffolding: a decorator that times each stage into
record.timing.stage_timings and logs stage entry/exit for the demo console.
"""
from __future__ import annotations

import functools
import logging

from memory.models import AxisScore
from utils.timing import timed_stage

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("vc_brain")


def axis_score_from_llm(data: dict, default_rating: str = "neutral") -> AxisScore:
    """Parses an LLM JSON response into an AxisScore, tolerating a stub/empty
    response (e.g. when OPENAI_API_KEY is missing or the call failed) by
    falling back to an explicitly-labeled neutral placeholder rather than
    crashing or silently emitting garbage.
    """
    if not data or data.get("_stub"):
        return AxisScore(
            rating=default_rating,
            score=50.0,
            trend="stable",
            rationale=(
                "LLM unavailable (stub mode) — placeholder neutral score. "
                "Rerun with a live OPENAI_API_KEY for a real assessment."
            ),
        )
    try:
        score = float(data.get("score", 50.0))
    except (TypeError, ValueError):
        score = 50.0
    score = max(0.0, min(100.0, score))
    trend = data.get("trend", "stable")
    if trend not in ("improving", "stable", "declining"):
        trend = "stable"
    return AxisScore(
        rating=str(data.get("rating", default_rating)),
        score=score,
        trend=trend,
        rationale=str(data.get("rationale", "")),
    )


def agent_stage(stage_name: str):
    """Decorates an agent's `run(record, ...) -> record` function.

    Wraps the call in a timed_stage block (writing elapsed seconds into
    record.timing.stage_timings[stage_name]) and logs entry/exit.
    """

    def decorator(func):
        @functools.wraps(func)
        def wrapper(record, *args, **kwargs):
            logger.info("[%s] -> %s", record.company_name, stage_name)
            with timed_stage(record, stage_name):
                result = func(record, *args, **kwargs)
            elapsed = record.timing.stage_timings.get(stage_name, 0.0)
            logger.info("[%s] <- %s (%.3fs)", record.company_name, stage_name, elapsed)
            return result

        return wrapper

    return decorator
