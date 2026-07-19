"""Founder-facing application form.

Public entry point for a newcomer founder (no track record, no warm intro,
possibly a first-time founder) to submit into the VC Brain pipeline. Posts to
the same `POST /founders/inbound` endpoint used by any other inbound source,
so the applicant runs through the full Sourcing -> Screening -> Diligence
pipeline exactly like every other founder record.

Per the tool's design principle of never exposing a collapsed verdict, the
applicant only ever sees a submission confirmation here -- founder_score,
memo, and adversarial_view remain investor-only, visible in ui/dashboard.py.
"""
from __future__ import annotations

import os
import sys

import requests
import streamlit as st

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents.sourcing_agent import extract_pdf_text_from_bytes  # noqa: E402
from agents.thesis_matching_agent import DEFAULT_THESIS  # noqa: E402

API_BASE_URL = os.environ.get("VC_BRAIN_API_URL", "http://localhost:8000")

st.set_page_config(page_title="Apply — VC Brain", layout="centered")

_LABELS = {
    "ai/ml": "AI/ML",
    "ai": "AI",
    "us": "US",
    "eu": "EU",
}


def _label(value: str) -> str:
    return _LABELS.get(value, value.title())


def _blank_to_none(value: str) -> str | None:
    value = value.strip()
    return value or None


def main() -> None:
    st.title("Apply to VC Brain")
    st.caption(
        "For anyone with an idea — a student, a first-time founder, an engineer who has never "
        "pitched anyone. No warm intro required. Your application goes through the same automated "
        "sourcing, screening, and diligence pipeline as every other lead."
    )

    try:
        requests.get(f"{API_BASE_URL}/health", timeout=3).raise_for_status()
    except requests.RequestException:
        st.error(f"Cannot reach the VC Brain API at {API_BASE_URL}. Start it with: `uvicorn api.main:app --reload`")
        st.stop()

    with st.form("founder_application", clear_on_submit=False):
        st.subheader("About you and your company")
        st.caption(
            "Sector, stage, and geography are matched against the fund's current thesis for the "
            "first-pass screen below — pick the closest fit."
        )
        col1, col2 = st.columns(2)
        with col1:
            name = st.text_input("Your name *")
            sector = st.selectbox("Sector", options=DEFAULT_THESIS["sectors"], format_func=_label)
            geography = st.selectbox("Geography", options=DEFAULT_THESIS["geographies"], format_func=_label)
        with col2:
            company_name = st.text_input("Company / project name *")
            stage = st.selectbox("Stage", options=DEFAULT_THESIS["stages"], format_func=_label)

        st.subheader("Pitch deck")
        st.caption("Upload a PDF, or paste your deck/pitch text below. If both are given, the PDF is used.")
        deck_pdf = st.file_uploader("Pitch deck (PDF)", type=["pdf"])
        deck_text_input = st.text_area(
            "Or paste your pitch / deck text *",
            height=200,
            placeholder="What are you building, for whom, and why now? Include any traction, team background, "
            "and metrics you have.",
        )

        st.subheader("Track record (optional — it's fine if none of this applies yet)")
        col3, col4 = st.columns(2)
        with col3:
            github_handle = st.text_input("GitHub handle")
            linkedin_url = st.text_input("LinkedIn URL")
            twitter_handle = st.text_input("Twitter / X handle")
        with col4:
            blog_url = st.text_input("Blog / personal site URL")
            claimed_hackathon = st.text_input("Hackathon you built this at (if any)")
            claimed_demo_url = st.text_input("Live demo URL (if any)")

        col5, col6 = st.columns(2)
        with col5:
            has_funding_history = st.checkbox("I've raised funding before")
        with col6:
            has_accelerator_history = st.checkbox("I've been through an accelerator before")

        submitted = st.form_submit_button("Submit application", use_container_width=True)

    if not submitted:
        return

    deck_text = deck_text_input.strip()
    if deck_pdf is not None:
        try:
            deck_text = extract_pdf_text_from_bytes(deck_pdf.read())
        except Exception as exc:  # noqa: BLE001
            st.error(f"Couldn't read that PDF ({exc}). Please try pasting the text instead.")
            return

    if not name.strip() or not company_name.strip() or not deck_text.strip():
        st.warning("Name, company name, and a pitch (PDF or pasted text) are required.")
        return

    payload = {
        "name": name.strip(),
        "company_name": company_name.strip(),
        "deck_text": deck_text,
        "sector": _blank_to_none(sector),
        "stage": _blank_to_none(stage),
        "geography": _blank_to_none(geography),
        "github_handle": _blank_to_none(github_handle),
        "linkedin_url": _blank_to_none(linkedin_url),
        "claimed_hackathon": _blank_to_none(claimed_hackathon),
        "claimed_demo_url": _blank_to_none(claimed_demo_url),
        "twitter_handle": _blank_to_none(twitter_handle),
        "blog_url": _blank_to_none(blog_url),
        "has_funding_history": has_funding_history,
        "has_accelerator_history": has_accelerator_history,
    }

    with st.spinner("Reviewing your application — this runs our full sourcing and diligence pipeline, up to a minute…"):
        try:
            response = requests.post(f"{API_BASE_URL}/founders/inbound", json=payload, timeout=120)
            response.raise_for_status()
            record = response.json()
        except requests.RequestException as exc:
            st.error(f"Submission failed: {exc}")
            return

    st.success("Application received.")
    st.markdown(f"**Reference ID:** `{record['founder_id']}`")
    st.write("Our team reviews every application against the same pipeline — you'll hear from us if there's a fit.")


if __name__ == "__main__":
    main()
