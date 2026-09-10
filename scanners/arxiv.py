"""arXiv research paper scanner using the public Atom/XML query API."""
from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

import requests

from memory.signals import Signal

logger = logging.getLogger(__name__)
API_URL = "https://export.arxiv.org/api/query"
ATOM_NS = {"atom": "http://www.w3.org/2005/Atom"}


def _score(published_str: str | None) -> float:
    if not published_str:
        return 50.0
    try:
        published = datetime.fromisoformat(published_str.replace("Z", "+00:00"))
        days = max(0, (datetime.now(timezone.utc) - published).days)
        return round(max(10.0, min(100.0, 100.0 - min(80.0, days * 0.15))), 2)
    except (ValueError, TypeError):
        return 50.0


def scan(query: str, *, max_results: int = 10) -> list[Signal]:
    headers = {
        "User-Agent": "the-vc-brain-scanner",
    }
    try:
        response = requests.get(
            API_URL,
            params={
                "search_query": f"all:{query}",
                "start": 0,
                "max_results": max(1, min(max_results, 50)),
                "sortBy": "submittedDate",
                "sortOrder": "descending",
            },
            headers=headers,
            timeout=15,
        )
        response.raise_for_status()
        root = ET.fromstring(response.text)
    except (requests.RequestException, ValueError, TypeError, ET.ParseError) as exc:
        logger.warning("arXiv scanner failed for %r: %s", query, exc)
        return []

    signals: list[Signal] = []
    for entry in root.findall("atom:entry", ATOM_NS)[:max_results]:
        raw_id = entry.findtext("atom:id", default="", namespaces=ATOM_NS).strip()
        title_raw = entry.findtext("atom:title", default="Untitled paper", namespaces=ATOM_NS)
        title = " ".join(title_raw.split())
        summary_raw = entry.findtext("atom:summary", default="No abstract provided.", namespaces=ATOM_NS)
        summary = " ".join(summary_raw.split())
        published = entry.findtext("atom:published", default="", namespaces=ATOM_NS).strip()
        updated = entry.findtext("atom:updated", default="", namespaces=ATOM_NS).strip()

        # Find HTML abstract URL if available, else fallback to id
        source_url = raw_id
        for link in entry.findall("atom:link", ATOM_NS):
            if link.attrib.get("rel") == "alternate" and link.attrib.get("type") == "text/html":
                source_url = link.attrib.get("href", source_url)
                break

        authors = [
            author.findtext("atom:name", default="", namespaces=ATOM_NS).strip()
            for author in entry.findall("atom:author", ATOM_NS)
        ]
        authors = [name for name in authors if name]

        categories = [
            cat.attrib.get("term", "").strip()
            for cat in entry.findall("atom:category", ATOM_NS)
            if cat.attrib.get("term")
        ]

        signals.append(
            Signal(
                source="arxiv",
                external_id=raw_id or source_url,
                title=title,
                source_url=source_url,
                summary=summary[:2000],
                query=query,
                score=_score(published),
                observed_at=published or updated or datetime.now(timezone.utc).isoformat(),
                raw_payload={
                    "authors": authors,
                    "published": published,
                    "updated": updated,
                    "categories": categories,
                },
            )
        )

    return signals
