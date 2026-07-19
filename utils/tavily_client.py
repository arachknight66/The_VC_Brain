"""Thin wrapper around the Tavily search API used for evidence retrieval.

If TAVILY_API_KEY is missing (or a call fails), returns an empty result
list rather than raising — every downstream agent already treats "no
evidence found" as a first-class, honest outcome (unverifiable).
"""
from __future__ import annotations

import logging
import os

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

_api_key = os.environ.get("TAVILY_API_KEY")
_client = None
if _api_key:
    try:
        from tavily import TavilyClient

        _client = TavilyClient(api_key=_api_key)
    except ImportError:
        logger.warning("tavily-python not installed; Tavily search disabled")


def is_live() -> bool:
    return _client is not None


def search(query: str, *, max_results: int = 5) -> list[dict]:
    """Runs a Tavily search. Returns a list of {title, url, content, score} dicts.

    Returns [] on missing key, API error, or no results — never raises.
    """
    if _client is None:
        return []
    try:
        response = _client.search(query=query, max_results=max_results)
        return response.get("results", [])
    except Exception as exc:  # noqa: BLE001 - hackathon-scope: never let a search outage kill the pipeline
        logger.warning("Tavily search failed for query %r (%s)", query, exc)
        return []
