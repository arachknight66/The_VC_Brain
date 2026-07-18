"""Shared agent scaffolding: a decorator that times each stage into
record.timing.stage_timings and logs stage entry/exit for the demo console.
"""
from __future__ import annotations

import functools
import logging

from utils.timing import timed_stage

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("vc_brain")


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
