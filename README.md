# VC Brain

An AI-first system that sources, scores, and produces evidence-backed investment memos for startup
founders — compressing Sourcing → Screening → Diligence → Decision into a fast, auditable pipeline.
Built for Hack-Nation's 6th Global AI Hackathon, Track 02 (Maschmeyer Group), per the spec in
[`build.md`](./build.md).

**Design principle enforced throughout:** the system never outputs a single collapsed "yes/no"
investment decision. It outputs scores, evidence, and confidence — a human makes the call.

## Differentiators built

1. **Independent, non-averaged 3-axis scoring** — Founder / Market / Idea-vs-Market are three separate
   OpenAI calls with separate prompts, never combined into one number in `axis_scores`.
2. **Per-claim Trust Score** with evidence citations — not a single company-level trust score.
3. **A genuinely independent Adversarial Agent** — structurally isolated from the memo agent: it only
   ever receives a redacted evidence bundle that excludes `record.memo` (see
   `agents/adversarial_agent.py::_evidence_bundle`), enforced at the API boundary, not by convention.
4. **A dedicated Build Evidence Agent** — verifies whether a founder actually built something even
   without a public GitHub repo, via hackathon-platform search, a live HTTP check, demo-video search,
   and Product Hunt search, all logged (including negatives) for full transparency.
5. **Cold-start handling** via a public-footprint fallback signal, explicitly tagged
   `confidence_basis: "public_footprint_fallback"` wherever it's used.
6. **Live speed instrumentation** — every pipeline stage is timed into `timing.stage_timings`, and the
   dashboard shows signal → memo-ready elapsed time per founder, computed live.
7. **Persistent Founder Score** across sessions — SQLite carries forward `founder_score.history` and
   computes a trend arrow on each rerun rather than starting fresh every time.

## Architecture

```
Sourcing → Entity Resolution → Thesis Match → Cold-Start Check →
  [Founder Axis | Market Axis | Idea-vs-Market Axis] (3 independent LLM calls)
  → Build Evidence → Trust Score → Founder Score (weighted blend)
  → Memo (deterministic, citation-grounded) → Adversarial (evidence-only, memo-blind)
  → persisted to SQLite
```

- **Backend:** Python, FastAPI, SQLite (via raw `sqlite3`, JSON-blob storage keyed by `founder_id`,
  with `name`/`company_name`/`founder_score` as indexed columns for the ranked list).
- **LLM calls:** OpenAI (`gpt-4o` by default, `OPENAI_MODEL` env override).
- **Evidence retrieval:** Tavily search API.
- **Frontend:** Streamlit, talking to the FastAPI layer over HTTP (not the SQLite store directly).
- **Persistence contract:** every agent reads/writes against `data/schema/founder_record.schema.json`.

Every OpenAI/Tavily client call degrades gracefully (`utils/openai_client.py`,
`utils/tavily_client.py`) — a missing key, quota error, or network failure never crashes the pipeline;
it falls back to a clearly-labeled stub/empty result so `run_demo.py` always completes.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in OPENAI_API_KEY and TAVILY_API_KEY
python run_demo.py --reset
```

Run the API and dashboard (in separate terminals, from the repo root):

```bash
uvicorn api.main:app --reload
streamlit run ui/dashboard.py
```

This also serves the founder-facing application form as a second page (`ui/pages/1_Apply.py`,
shown as "Apply" in the Streamlit sidebar) — the front door for anyone with no warm intro: a
student, a first-time founder, an engineer applying cold. It accepts a pasted pitch or a PDF
deck upload (extracted via `agents/sourcing_agent.py::extract_pdf_text_from_bytes`) plus optional
GitHub/LinkedIn/Twitter/blog links, and posts to the same `POST /founders/inbound` endpoint used by
any other inbound source — so an applicant runs through the identical Sourcing → Screening →
Diligence pipeline as every other lead. Per the no-collapsed-verdict design principle, the applicant
only ever sees a submission confirmation; `founder_score`/memo/adversarial view stay investor-only in
the main dashboard view.

Run tests:

```bash
pytest tests/ -q
```

## Founder Score formula

`founder_score.value` (0-100) is a weighted blend of three components:

| Component | Weight | Definition |
|---|---|---|
| Axis component | 60% | Mean of the three independent axis scores (founder / market / idea-vs-market). This is the **one** place the three axes are combined — `axis_scores` itself is never collapsed; this is a separate, persistent cross-opportunity ranking metric, not "the" investment decision. |
| Trust component | 25% | Mean confidence across extracted `trust_claims`, with any `contradiction_flag: true` claim forced to 0 regardless of its stated confidence. |
| Build component | 15% | `build_evidence.tier` mapped to a fixed score (`verified_working`=100, `verified_submitted`=60, `unverifiable`=20). Skipped — weight redistributed proportionally to axis/trust — when `tier == not_applicable` (no build claim to check). |

`founder_score.confidence` (0-1) averages: entity-resolution confidence (if any external handle was
given), the fraction of trust claims that cleared `unverifiable`, and the build-evidence component —
capped at **0.5** whenever `confidence_basis == "public_footprint_fallback"` (cold start), since that's
an explicitly lower-confidence proxy signal.

`founder_score.trend` compares the new value to the most recent prior run for the same founder (by
name match in SQLite): `improving` / `declining` if the change exceeds 2 points, else `stable`. First
run for a founder is always `stable`.

## Synthetic data

Six profiles in `data/synthetic_founders/`, each built to demonstrate one behavior:

| File | Demonstrates |
|---|---|
| `founder_01_alpha.json` | Strong founder, real-looking GitHub/funding/accelerator signals. |
| `founder_02_beta.json` | Decent founder, a contested market-size claim for the Trust Score agent. |
| `founder_03_gamma.json` | "Spin" profile — polished language, claims that don't hold up (backed by a scout program, 2M users, major press — all unverifiable). |
| `founder_04_delta_coldstart.json` | No GitHub, no funding, no accelerator, but a public blog/Twitter footprint — triggers Section 5.10 cold-start fallback. |
| `founder_05_epsilon_a_buildcheck.json` | Hackathon build claim with a **live, working demo URL** → `build_evidence.tier == "verified_working"`. |
| `founder_06_epsilon_b_buildcheck.json` | Same claim, but the demo URL is dead and there's no findable submission → `build_evidence.tier == "unverifiable"`. |

The Epsilon-A/B contrast is guaranteed deterministically: Epsilon-A's `claimed_demo_url` points to a
real, stable, live site so the HTTP check reliably returns 200; Epsilon-B's points to a nonexistent
domain so the HTTP check reliably fails. This was a deliberate design choice after discovering during
testing that Tavily's OR-based search returns loosely-relevant results even for fully fictional
companies — a non-empty result list is not evidence on its own, so `build_evidence_agent.py` and
`trust_score_agent.py` both require the founder/company name to literally appear in a result before
counting it as corroboration (see `_find_corroborating_result` / the heuristic classifier).

## Known limitations / deprioritized under time constraints

- **Python 3.10** was used instead of the spec's 3.11+ (that's what was available in this environment);
  nothing in the codebase is 3.11-specific.
- **Domain/cert timestamp check** (build.md 5.3, signal 4) is explicitly logged as skipped in every
  `build_evidence.evidence_log` rather than implemented — it was marked "nice-to-have, not blocking" in
  the spec, and `python-whois` was left out of scope for hackathon time.
- **Thesis matching is keyword-based, not an LLM call** — a deliberate choice (not a shortcut): it's a
  fast first-pass filter meant to save API calls before full scoring, so making it an LLM call would
  undermine its own purpose.
- **Contradiction-flag detection is inherently LLM-dependent.** An offline heuristic fallback exists so
  the pipeline never crashes without a live key, but it cannot semantically detect a contradiction (that
  requires comparing a claim's meaning against retrieved evidence) — it only recognizes when retrieved
  evidence literally names the company. Full accuracy on Beta/Gamma's contested claims requires a live,
  non-quota-limited `OPENAI_API_KEY`.
- **`memo_agent.py`'s narrative sections (company snapshot) use a live LLM call for prose framing only**
  — every citable fact is composed deterministically from `trust_claims`/`axis_scores`/`build_evidence`
  before the LLM ever sees it, and the LLM is explicitly instructed not to introduce new facts. This
  guarantees the "every claim traces to a source" rule by construction rather than by hoping the model
  complies.
- **`memory/scoring.py` (founder_score formula) and `agents/cold_start_agent.py`** are additional
  modules not named in build.md's Section 3 file tree, added because Section 5.9/5.10 describe behavior
  that needs a home; kept as thin, single-purpose modules rather than folding them into an existing
  agent.
- **Out of scope entirely** (per build.md Section 12): portfolio monitoring, follow-on decision logic,
  fund operations, exit modeling, full production auth/multi-tenancy, a live continuous background
  scanning daemon, the full Sourcing & Network Intelligence graph, and any custom dashboard styling
  beyond Streamlit's defaults. The one live outbound signal built for extra credit is a minimal,
  unauthenticated GitHub repository search (`agents/sourcing_agent.py::github_topic_search`).

## Definition of Done — status

`run_demo.py --reset` runs end-to-end on all 6 synthetic profiles with no errors; the FastAPI layer
serves real SQLite-backed data (`GET /founders`, `GET /founders/{id}/memo`,
`GET /founders/{id}/build-evidence`); the Streamlit dashboard's three views were verified against the
live API (all data-access patterns validated, no exceptions) — a visual browser screenshot wasn't
possible in this headless environment, so if you want a final visual check, run the two `uvicorn`/
`streamlit` commands above yourself; and the Epsilon-A/Epsilon-B pair visibly resolves to different
`build_evidence` tiers (`verified_working` vs `unverifiable`) end to end through the API.

One live note: the `OPENAI_API_KEY` provided during this build returned `insufficient_quota` (HTTP 429)
on every call. The pipeline still runs to completion using the graceful stub fallback described above,
but every axis score, memo narrative, and adversarial view generated so far reflects placeholder text,
not a real model assessment — rerun `python run_demo.py --reset` once billing is resolved on that
account to see real output. `TAVILY_API_KEY` is live and working throughout.
