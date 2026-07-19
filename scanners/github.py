"""GitHub repository scanner using the public Search API."""
from __future__ import annotations

import logging
import math
import os
from datetime import datetime, timezone

import requests

from memory.signals import Signal

logger = logging.getLogger(__name__)
API_URL = "https://api.github.com/search/repositories"


def _score(item: dict) -> float:
    stars = max(0, int(item.get("stargazers_count", 0)))
    forks = max(0, int(item.get("forks_count", 0)))
    pushed_at = item.get("pushed_at")
    freshness = 0.0
    if pushed_at:
        try:
            pushed = datetime.fromisoformat(pushed_at.replace("Z", "+00:00"))
            days = max(0, (datetime.now(timezone.utc) - pushed).days)
            freshness = max(0.0, 25.0 - min(days, 25))
        except ValueError:
            pass
    return round(min(100.0, math.log10(stars + 1) * 25 + math.log10(forks + 1) * 10 + freshness), 2)


def scan(query: str, *, max_results: int = 10) -> list[Signal]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "the-vc-brain-scanner",
    }
    if token := os.getenv("GITHUB_TOKEN"):
        headers["Authorization"] = f"Bearer {token}"
    try:
        response = requests.get(
            API_URL,
            params={
                "q": f"{query} in:name,description,readme",
                "sort": "updated",
                "order": "desc",
                "per_page": max(1, min(max_results, 50)),
            },
            headers=headers,
            timeout=12,
        )
        response.raise_for_status()
        items = response.json().get("items", [])
    except (requests.RequestException, ValueError, TypeError) as exc:
        logger.warning("GitHub scanner failed for %r: %s", query, exc)
        return []

    return [
        Signal(
            source="github",
            external_id=str(item.get("id") or item.get("html_url")),
            title=item.get("full_name", "Untitled repository"),
            source_url=item.get("html_url", ""),
            summary=item.get("description") or "No repository description provided.",
            query=query,
            score=_score(item),
            observed_at=item.get("pushed_at") or item.get("updated_at") or datetime.now(timezone.utc).isoformat(),
            raw_payload={
                "stars": item.get("stargazers_count", 0),
                "forks": item.get("forks_count", 0),
                "language": item.get("language"),
                "topics": item.get("topics", []),
                "owner": item.get("owner", {}).get("login"),
                "created_at": item.get("created_at"),
                "pushed_at": item.get("pushed_at"),
            },
        )
        for item in items[:max_results]
        if item.get("html_url")
    ]
