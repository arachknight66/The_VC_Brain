"""Stage 0/1: inbound + outbound signal intake.

Inbound: turns a raw application (name, company_name, deck_text[, pdf]) into
a FounderRecord.

Outbound: for hackathon scope, "outbound" signals are read from the
synthetic founder profiles in data/synthetic_founders/ rather than live
scrapers (see build.md Section 5.1). A minimal, real GitHub search call is
included as the optional extra-credit live signal.
"""
from __future__ import annotations

import json
import io
import logging
import os

import requests

from agents.base import agent_stage
from memory.models import FounderRecord, now_iso

logger = logging.getLogger("vc_brain")

SYNTHETIC_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_founders")
MAX_PITCH_BYTES = 10 * 1024 * 1024
ALLOWED_PITCH_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/octet-stream",
}


@agent_stage("sourcing")
def run(record: FounderRecord) -> FounderRecord:
    """No-op timing hook: intake already happened in create_* below, but every
    agent exposes a run(record) entrypoint for a uniform pipeline call shape.
    """
    return record


def create_from_inbound(name: str, company_name: str, deck_text: str, **extra_raw_inputs) -> FounderRecord:
    """Builds a FounderRecord from a live inbound application."""
    raw_inputs = {
        "deck_text": deck_text,
        "deck_images": [],
        "github_handle": None,
        "linkedin_url": None,
        "claimed_hackathon": None,
        "claimed_demo_url": None,
    }
    raw_inputs.update(extra_raw_inputs)
    record = FounderRecord(name=name, company_name=company_name, source_channel="inbound", raw_inputs=raw_inputs)
    record.timing.signal_detected_at = now_iso()
    record.timing.application_triggered_at = now_iso()
    return record


def extract_pdf_text(pdf_path: str) -> str:
    """Minimal PDF-to-text extraction using pypdf, per build.md 5.1."""
    from pypdf import PdfReader

    reader = PdfReader(pdf_path)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def extract_pitch_text(filename: str, content_type: str | None, data: bytes) -> str:
    """Validate and extract uploaded PDF, TXT, or Markdown pitch content."""
    if not data:
        raise ValueError("Pitch file is empty")
    if len(data) > MAX_PITCH_BYTES:
        raise ValueError("Pitch file exceeds the 10 MB limit")
    extension = os.path.splitext(filename or "")[1].lower()
    if content_type not in ALLOWED_PITCH_TYPES and extension not in {".pdf", ".txt", ".md"}:
        raise ValueError("Pitch must be a PDF, TXT, or Markdown file")
    if extension == ".pdf" or content_type == "application/pdf":
        from pypdf import PdfReader

        try:
            reader = PdfReader(io.BytesIO(data))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            raise ValueError("Pitch PDF could not be parsed") from exc
    else:
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValueError("Pitch text must be UTF-8 encoded") from exc
    if not text.strip():
        raise ValueError("Pitch contains no extractable text")
    return text.strip()


def extract_pdf_text_from_bytes(data: bytes) -> str:
    """Compatibility helper for the Streamlit application page."""
    return extract_pitch_text("pitch.pdf", "application/pdf", data)


def load_from_synthetic(profile_path: str) -> FounderRecord:
    """Loads a synthetic founder profile JSON as if it were a scraped outbound signal."""
    with open(profile_path) as f:
        data = json.load(f)

    record = FounderRecord(
        name=data["name"],
        company_name=data["company_name"],
        source_channel=data.get("source_channel", "hackathon_scan"),
        raw_inputs=data.get("raw_inputs", {}),
    )
    record.timing.signal_detected_at = now_iso()
    record.timing.application_triggered_at = now_iso()
    return record


def load_all_synthetic_profiles(directory: str = SYNTHETIC_DIR) -> list[FounderRecord]:
    records = []
    for filename in sorted(os.listdir(directory)):
        if filename.endswith(".json"):
            records.append(load_from_synthetic(os.path.join(directory, filename)))
    return records


def github_topic_search(topic: str, max_results: int = 3) -> list[dict]:
    """Extra-credit live outbound signal: a real, minimal GitHub search call.

    No auth required for basic public search; heavily rate-limited by GitHub
    for unauthenticated requests, so failures are swallowed and an empty
    list is returned rather than raising.
    """
    try:
        response = requests.get(
            "https://api.github.com/search/repositories",
            params={"q": f"topic:{topic}", "sort": "updated", "order": "desc", "per_page": max_results},
            headers={"Accept": "application/vnd.github+json"},
            timeout=5,
        )
        response.raise_for_status()
        items = response.json().get("items", [])
        return [
            {"name": item["full_name"], "description": item.get("description"), "url": item["html_url"]}
            for item in items[:max_results]
        ]
    except Exception as exc:  # noqa: BLE001
        logger.warning("GitHub outbound signal search failed (%s)", exc)
        return []
