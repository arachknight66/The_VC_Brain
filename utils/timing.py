"""Speed instrumentation: a context manager that times a pipeline stage and
writes the elapsed seconds into FounderRecord.timing.stage_timings.
"""
from __future__ import annotations

import time
from contextlib import contextmanager


@contextmanager
def timed_stage(record, stage_name: str):
    """Times a block of code and records it under record.timing.stage_timings[stage_name].

    `record` must have a `.timing.stage_timings` dict (FounderRecord does).
    """
    start = time.monotonic()
    try:
        yield
    finally:
        elapsed = time.monotonic() - start
        record.timing.stage_timings[stage_name] = round(elapsed, 4)


def total_elapsed_seconds(record) -> float:
    return round(sum(record.timing.stage_timings.values()), 4)
