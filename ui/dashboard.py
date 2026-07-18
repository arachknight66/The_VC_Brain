"""Streamlit Investor Dashboard (build.md Section 7).

Talks to the FastAPI layer over HTTP (not the SQLite store directly), per
the Definition of Done. Run the API first: `uvicorn api.main:app`.
"""
from __future__ import annotations

import os

import pandas as pd
import requests
import streamlit as st

API_BASE_URL = os.environ.get("VC_BRAIN_API_URL", "http://localhost:8000")

TREND_ARROWS = {"improving": "↑", "stable": "→", "declining": "↓"}
BADGE_COLORS = {
    "known_verified": "#1a7f37",
    "statistical_association": "#9a6700",
    "unverifiable": "#cf222e",
}
BUILD_TIER_COLORS = {
    "verified_working": "#1a7f37",
    "verified_submitted": "#9a6700",
    "unverifiable": "#cf222e",
    "not_applicable": "#6e7781",
}

st.set_page_config(page_title="VC Brain", layout="wide")


def _badge(text: str, color: str) -> str:
    return f'<span style="background:{color};color:white;padding:2px 8px;border-radius:10px;font-size:0.8em;">{text}</span>'


@st.cache_data(ttl=5)
def fetch_founders() -> list[dict]:
    response = requests.get(f"{API_BASE_URL}/founders", timeout=10)
    response.raise_for_status()
    return response.json()


def fetch_founder(founder_id: str) -> dict:
    response = requests.get(f"{API_BASE_URL}/founders/{founder_id}", timeout=10)
    response.raise_for_status()
    return response.json()


def fetch_memo(founder_id: str) -> dict:
    response = requests.get(f"{API_BASE_URL}/founders/{founder_id}/memo", timeout=10)
    response.raise_for_status()
    return response.json()


def fetch_build_evidence(founder_id: str) -> dict:
    response = requests.get(f"{API_BASE_URL}/founders/{founder_id}/build-evidence", timeout=10)
    response.raise_for_status()
    return response.json()


def render_ranked_list() -> None:
    st.header("Ranked List")
    founders = fetch_founders()
    if not founders:
        st.info("No founder records yet. Run `python run_demo.py` or submit an inbound application.")
        return

    rows = []
    for f in founders:
        rows.append(
            {
                "Company": f["company_name"],
                "Founder": f["name"],
                "Founder Score": f["founder_score"]["value"],
                "Trend": TREND_ARROWS.get(f["founder_score"]["trend"], "→"),
                "Confidence": f["founder_score"]["confidence"],
                "Confidence Basis": f["founder_score"].get("confidence_basis") or "track_record",
                "Source Channel": f["source_channel"],
                "Build Evidence": f["build_evidence"]["tier"],
                "Signal → Memo (s)": f["timing"].get("elapsed_seconds"),
                "Screened Out": f["screened_out"],
            }
        )
    df = pd.DataFrame(rows).sort_values("Founder Score", ascending=False)
    st.dataframe(df, use_container_width=True, hide_index=True)


def render_memo_view() -> None:
    st.header("Memo View")
    founders = fetch_founders()
    if not founders:
        st.info("No founder records yet. Run `python run_demo.py` or submit an inbound application.")
        return

    options = {f"{f['company_name']} ({f['name']})": f["founder_id"] for f in founders}
    choice = st.selectbox("Select founder", list(options.keys()))
    founder_id = options[choice]

    record = fetch_founder(founder_id)
    data = fetch_memo(founder_id)
    memo, adversarial = data["memo"], data["adversarial_view"]

    if record.get("trust_claims"):
        st.subheader("Trust Claims")
        badges = []
        for c in record["trust_claims"]:
            color = BADGE_COLORS.get(c["evidence_category"], "#6e7771")
            flag = " ⚠" if c["contradiction_flag"] else ""
            badges.append(
                f'<div style="margin-bottom:4px;">{_badge(c["evidence_category"], color)} '
                f'conf={c["confidence"]:.2f}{flag} — {c["claim_text"]}</div>'
            )
        st.markdown("".join(badges), unsafe_allow_html=True)
        st.divider()

    left, right = st.columns(2)
    with left:
        st.subheader("Investment Memo (bull case)")
        st.markdown(f"**Company Snapshot**\n\n{memo.get('company_snapshot', '')}")
        st.markdown("**Investment Hypotheses**")
        for h in memo.get("investment_hypotheses", []):
            st.markdown(f"- {h}")
        st.markdown("**SWOT**")
        swot = memo.get("swot", {})
        for key in ("strengths", "weaknesses", "opportunities", "threats"):
            st.markdown(f"*{key.capitalize()}*")
            for item in swot.get(key, []):
                st.markdown(f"- {item}")
        st.markdown("**Problem & Product**")
        st.write(memo.get("problem_and_product", ""))
        st.markdown("**Traction & KPIs**")
        st.write(memo.get("traction_and_kpis", ""))
        with st.expander("Optional sections"):
            for key in (
                "team_and_history",
                "technology_and_defensibility",
                "market_sizing",
                "competition",
                "financials_and_round_structure",
                "cap_table",
                "due_diligence_log",
                "exit_perspective",
            ):
                st.markdown(f"**{key.replace('_', ' ').title()}**")
                st.write(memo.get(key, "not disclosed"))

    with right:
        st.subheader("Adversarial View (bear case)")
        st.markdown(f"**Bear Case Summary**\n\n{adversarial.get('bear_case_summary', '')}")
        st.markdown("**Key Risks**")
        for r in adversarial.get("key_risks", []):
            st.markdown(f"- {r}")
        st.markdown("**Unresolved Red Flags**")
        for r in adversarial.get("unresolved_red_flags", []):
            st.markdown(f"- {r}")
        st.markdown("**What Would Change My Mind**")
        st.write(adversarial.get("what_would_change_my_mind", ""))


def render_build_evidence_panel() -> None:
    st.header("Build Evidence Panel")
    founders = fetch_founders()
    if not founders:
        st.info("No founder records yet. Run `python run_demo.py` or submit an inbound application.")
        return

    options = {f"{f['company_name']} ({f['name']})": f["founder_id"] for f in founders}
    choice = st.selectbox("Select founder", list(options.keys()))
    founder_id = options[choice]

    be = fetch_build_evidence(founder_id)
    tier = be["tier"]
    color = BUILD_TIER_COLORS.get(tier, "#6e7781")
    label = {
        "verified_working": "VERIFIED — WORKING",
        "verified_submitted": "VERIFIED — SUBMITTED",
        "unverifiable": "UNVERIFIABLE",
        "not_applicable": "NOT APPLICABLE (no hackathon-build claim on record)",
    }.get(tier, tier.upper())

    st.markdown(
        f'<div style="background:{color};color:white;padding:16px;border-radius:8px;'
        f'font-size:1.4em;font-weight:bold;text-align:center;margin-bottom:16px;">{label}</div>',
        unsafe_allow_html=True,
    )

    if not be["evidence_log"]:
        st.info("No build-evidence checks were run for this founder (no hackathon/demo build claim on record).")
        return

    st.subheader("Every signal checked")
    for entry in be["evidence_log"]:
        icon = "✅" if entry["found"] else "❌"
        with st.container(border=True):
            st.markdown(f"{icon} **{entry['signal']}**")
            st.write(entry["detail"])
            if entry.get("source_url"):
                st.markdown(f"[source]({entry['source_url']})")


def main() -> None:
    st.title("VC Brain")
    st.caption("Sourcing → Screening → Diligence → Decision, compressed into a fast, auditable pipeline.")

    try:
        requests.get(f"{API_BASE_URL}/health", timeout=3).raise_for_status()
    except requests.RequestException:
        st.error(f"Cannot reach the VC Brain API at {API_BASE_URL}. Start it with: `uvicorn api.main:app --reload`")
        st.stop()

    view = st.sidebar.radio("View", ["Ranked List", "Memo View", "Build Evidence Panel"])
    if view == "Ranked List":
        render_ranked_list()
    elif view == "Memo View":
        render_memo_view()
    else:
        render_build_evidence_panel()


if __name__ == "__main__":
    main()
