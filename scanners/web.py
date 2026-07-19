"""Domain-scoped public web scanners backed by Tavily."""
from __future__ import annotations

from urllib.parse import urlparse

from memory.signals import Signal
from utils.tavily_client import search

SOURCE_DOMAINS = {
    "x": ("x.com", "twitter.com"),
    "substack": ("substack.com",),
    "devpost": ("devpost.com",),
    "linkedin": ("linkedin.com/in", "linkedin.com/company"),
}


def scan(source: str, query: str, *, max_results: int = 10) -> list[Signal]:
    if source not in SOURCE_DOMAINS:
        raise ValueError(f"Unsupported web scanner: {source}")
    domains = SOURCE_DOMAINS[source]
    domain_clause = " OR ".join(f"site:{domain}" for domain in domains)
    results = search(f"({domain_clause}) {query}", max_results=max_results)
    signals: list[Signal] = []
    for result in results:
        url = result.get("url", "")
        if not url or not _matches_domain(url, domains):
            continue
        confidence = float(result.get("score") or 0.0)
        signals.append(
            Signal(
                source=source,
                external_id=url.rstrip("/"),
                title=result.get("title") or url,
                source_url=url,
                summary=(result.get("content") or "")[:2000],
                query=query,
                score=round(max(0.0, min(100.0, confidence * 100)), 2),
                raw_payload={"provider": "tavily", "provider_score": confidence},
            )
        )
    return signals


def _matches_domain(url: str, domains: tuple[str, ...]) -> bool:
    host = urlparse(url).netloc.lower()
    return any(domain.split("/")[0] in host for domain in domains)
