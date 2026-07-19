#!/usr/bin/env python3
"""CLI entrypoint for running and persisting Stage 0 scanners."""
from __future__ import annotations

import argparse
import json

from memory.signal_store import SignalStore
from scanners.orchestrator import SUPPORTED_SOURCES, run_scanners


def main() -> None:
    parser = argparse.ArgumentParser(description="Scan public founder and product signals")
    parser.add_argument("query", help="Thesis keyword or company/founder search")
    parser.add_argument("--sources", nargs="+", choices=SUPPORTED_SOURCES, default=list(SUPPORTED_SOURCES))
    parser.add_argument("--limit", type=int, default=10, help="Maximum results per source (1-25)")
    args = parser.parse_args()
    result = run_scanners(args.query, args.sources, max_results=args.limit, store=SignalStore())
    print(json.dumps(result.to_dict(), indent=2))


if __name__ == "__main__":
    main()
