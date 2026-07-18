# VC Brain — Build Specification for Claude Code

**Instructions to Claude Code:** This is a complete build spec for a 24-hour hackathon project. Build it end-to-end without pausing for confirmation between modules — proceed autonomously through the build order below, committing to git after each milestone. If a design decision isn't specified here, make a reasonable choice, document it in the README, and keep moving. Prioritize getting the full pipeline working end-to-end on synthetic data over polishing any single module.

---

## 1. Project Overview

**Name:** VC Brain
**Goal:** An AI-first system that sources, scores, and produces evidence-backed investment memos for startup founders — compressing Sourcing → Screening → Diligence → Decision into a fast, auditable pipeline. Built for Hack-Nation's 6th Global AI Hackathon, Track 02 (Maschmeyer Group).

**Core differentiators to build (beyond the baseline brief):**
1. Independent, non-averaged 3-axis scoring (Founder / Market / Idea-vs-Market)
2. Per-claim Trust Score with evidence citations, not a single company-level score
3. A genuinely independent Adversarial Agent (no shared reasoning chain with the bull-case memo agent)
4. A dedicated **Build Evidence Agent** — verifies whether a founder actually built something, even without a public GitHub repo (see Section 5.3)
5. Cold-start handling via a public-footprint fallback signal
6. Live speed instrumentation (time from signal → decision-ready memo)
7. Persistent Founder Score across sessions (not just per-opportunity)

**Design principle to enforce everywhere:** the system never outputs a single collapsed "yes/no" investment decision. It outputs scores, evidence, and confidence — a human makes the call.

---

## 2. Tech Stack

- **Backend:** Python 3.11+, FastAPI
- **Agent/LLM calls:** OpenAI API (`gpt-4o` or latest available model at build time)
- **Web search / evidence retrieval:** Tavily API
- **Persistence:** SQLite (via `sqlite3` or `sqlalchemy`) — simple, file-based, sufficient for hackathon scope. Do not over-engineer with a full DB server.
- **Frontend/demo UI:** Streamlit — fastest path to a working Investor Dashboard + Memo view + Adversarial view without a separate frontend build. UX is only 15% of the rubric; do not over-invest here.
- **Environment/secrets:** `.env` file (never commit), loaded via `python-dotenv`
- **Testing:** `pytest` for agent logic; a manual demo script for end-to-end runs

---

## 3. Directory Structure

```
vc-brain/
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
├── run_demo.py                  # end-to-end demo runner (see Section 8)
├── data/
│   ├── synthetic_founders/      # 5 synthetic founder profiles (decks + metadata)
│   │   ├── founder_01_alpha.json
│   │   ├── founder_02_beta.json
│   │   ├── founder_03_gamma.json
│   │   ├── founder_04_delta_coldstart.json
│   │   └── founder_05_epsilon_buildcheck.json
│   └── schema/
│       └── founder_record.schema.json
├── memory/
│   ├── store.py                 # SQLite persistence layer
│   ├── models.py                 # data classes: FounderRecord, AxisScore, TrustClaim, etc.
│   └── vc_brain.db               # created at runtime, gitignored
├── agents/
│   ├── __init__.py
│   ├── base.py                   # shared agent scaffolding (timing wrapper, logging)
│   ├── sourcing_agent.py         # Stage 0/1: inbound + outbound signal intake
│   ├── entity_resolution_agent.py
│   ├── thesis_matching_agent.py
│   ├── founder_axis_agent.py
│   ├── market_axis_agent.py
│   ├── idea_vs_market_agent.py
│   ├── build_evidence_agent.py   # THE NEW DIFFERENTIATOR — see Section 5.3
│   ├── trust_score_agent.py
│   ├── memo_agent.py
│   └── adversarial_agent.py      # deliberately isolated from memo_agent's reasoning
├── api/
│   ├── main.py                   # FastAPI app
│   └── routes.py                 # /founders, /founders/{id}/memo, /founders/{id}/build-evidence
├── ui/
│   └── dashboard.py               # Streamlit app
├── tests/
│   ├── test_agents.py
│   └── test_pipeline_e2e.py
└── utils/
    ├── openai_client.py
    ├── tavily_client.py
    └── timing.py                  # instrumentation for Section 7
```

---

## 4. Core Data Schemas

### 4.1 FounderRecord (the central object every agent reads/writes)

```json
{
  "founder_id": "uuid",
  "name": "string",
  "company_name": "string",
  "source_channel": "inbound | github_scan | hackathon_scan | launch_scan | accelerator_scan",
  "first_seen_at": "iso8601 timestamp",
  "last_updated_at": "iso8601 timestamp",
  "raw_inputs": {
    "deck_text": "string or null",
    "deck_images": ["base64 or file paths, optional"],
    "github_handle": "string or null",
    "linkedin_url": "string or null",
    "claimed_hackathon": "string or null",
    "claimed_demo_url": "string or null"
  },
  "founder_score": {
    "value": "float 0-100",
    "trend": "improving | stable | declining",
    "history": [{"timestamp": "...", "value": "...", "context": "..."}],
    "confidence": "float 0-1"
  },
  "axis_scores": {
    "founder": {"rating": "string", "score": "float", "trend": "...", "rationale": "string"},
    "market": {"rating": "bullish | neutral | bear", "score": "float", "trend": "...", "rationale": "string"},
    "idea_vs_market": {"rating": "string", "score": "float", "trend": "...", "rationale": "string"}
  },
  "build_evidence": {
    "tier": "verified_working | verified_submitted | unverifiable",
    "signals_checked": ["hackathon_platform", "live_url", "demo_video", "domain_cert", "product_hunt"],
    "evidence_log": [{"signal": "...", "found": true, "detail": "...", "source_url": "..."}]
  },
  "trust_claims": [
    {
      "claim_text": "string, e.g. '$50K MRR'",
      "confidence": "float 0-1",
      "evidence_category": "known_verified | statistical_association | unverifiable",
      "source": "string or null",
      "contradiction_flag": "boolean"
    }
  ],
  "memo": { "...structured memo sections, see Section 5.6" },
  "adversarial_view": { "...structured bear-case, see Section 5.7" },
  "timing": {
    "signal_detected_at": "iso8601",
    "application_triggered_at": "iso8601 or null",
    "memo_ready_at": "iso8601 or null",
    "elapsed_seconds": "float"
  }
}
```

Write this schema to `data/schema/founder_record.schema.json` as valid JSON Schema before building any agent — every agent reads/writes against this contract.

---

## 5. Module-by-Module Specification

### 5.1 Sourcing Agent (`agents/sourcing_agent.py`)

**Inbound path:**
- Accepts `company_name` + `deck_text` (for hackathon scope, accept plain text or a simple PDF-to-text extraction rather than building deck parsing from scratch — use `pypdf` for text extraction if a PDF is provided).
- Creates a new `FounderRecord` with `source_channel: "inbound"`.

**Outbound path (synthetic for demo purposes — do not build live scrapers against real GitHub/HN APIs under hackathon time pressure unless time allows):**
- Read from `data/synthetic_founders/` — treat these as if they were scraped signals.
- For extra credit if time allows: a real, minimal GitHub API call (`GET /search/repositories`) filtered by a topic keyword, to show at least one live outbound signal in the demo.

**Output:** a populated `FounderRecord` with `raw_inputs` filled, passed to the Thesis Matching Agent.

---

### 5.2 Entity Resolution Agent (`agents/entity_resolution_agent.py`)

- Given `name`, `github_handle`, `linkedin_url` from raw inputs, do a lightweight consistency check: does the name in the deck match the name associated with the GitHub/LinkedIn handle (fuzzy string match is sufficient for hackathon scope — use `rapidfuzz` or similar).
- If mismatch or ambiguity, set a flag in the record (`entity_resolution_confidence: float`) rather than silently proceeding.

---

### 5.3 Build Evidence Agent (`agents/build_evidence_agent.py`) — PRIORITY DIFFERENTIATOR

**Purpose:** Determine whether a founder actually built something, independent of whether their code is on public GitHub. This directly targets founders who build for hackathons but never make repos public.

**Trigger condition:** runs whenever a founder's `raw_inputs` includes a build claim (hackathon name, demo URL, "we built X") but the standard GitHub-scan signal is empty or thin.

**Signal checks, in this priority order (stop early if high-confidence signal found):**

1. **Hackathon submission platform check** — use Tavily to search `"{founder_name}" OR "{company_name}" site:devpost.com OR site:dorahacks.io OR "{claimed_hackathon}" submission`. If found, extract team name, submission description, any linked demo.
2. **Live URL check** — if `claimed_demo_url` is present, issue an HTTP GET (via `requests`, with a short timeout) and check for a 200 response and non-trivial HTML content (not a placeholder/parked page).
3. **Demo video check** — use Tavily to search `"{founder_name}" "{company_name}" demo OR walkthrough site:youtube.com OR site:loom.com`. If found, note the upload date if extractable.
4. **Domain/cert timestamp check** — for a claimed demo URL, attempt a basic WHOIS lookup or check certificate issuance via `python-whois` or an external API if time allows; treat as a nice-to-have, not blocking.
5. **Product Hunt check** — Tavily search `"{company_name}" site:producthunt.com`.

**Output — `build_evidence` field:**
- `verified_working` — live URL responds and functions, OR a dated demo video exists
- `verified_submitted` — hackathon platform confirms submission/team, but no live artifact found
- `unverifiable` — no independent corroboration found after all checks; **explicitly flagged as such, never silently treated as false or omitted**

Log every check performed (even negative results) into `evidence_log` — this transparency is itself a demo-worthy artifact ("here's everywhere we looked").

**Demo requirement:** include at least 2 synthetic founder profiles in `data/synthetic_founders/` specifically designed to showcase this agent — one that resolves to `verified_working` (has a real or realistic-looking hackathon submission + demo URL) and one that resolves to `unverifiable` (claims a build but has no corroborating trace). This contrast is the single most important demo moment for this differentiator — build it deliberately, don't leave it to chance.

---

### 5.4 Thesis Matching Agent (`agents/thesis_matching_agent.py`)

- Reads a configurable thesis object (sector, stage, geography, check size, ownership target, risk appetite) — hardcode a default thesis in config for demo purposes, but keep it parameterized so it's clearly configurable, not hardcoded logic.
- Simple filter: does the founder record match on sector/stage keywords (LLM call or keyword match is fine for hackathon scope). If clear mismatch, mark record as `screened_out: true` with a reason, and do not proceed to full scoring (saves API calls, also demonstrates the "fast first-pass filter" requirement).

---

### 5.5 Three-Axis Scoring Agents

Build as three **separate** OpenAI API calls (separate prompts, separate calls) — do not combine into one call that returns three scores, since that risks correlated reasoning. Each agent should:
- Take the `FounderRecord` (deck text, resolved entity data, any Tavily-retrieved comparables) as input
- Return a structured score (numeric 0-100), a rating label, a trend direction, and a short rationale
- Write independently to `axis_scores.founder`, `axis_scores.market`, `axis_scores.idea_vs_market` — **do not average these into a single number anywhere in the pipeline**

`market_axis_agent.py` should use Tavily to pull 2-3 comparable companies before scoring, to ground the market rating in retrieved evidence rather than pure LLM prior knowledge.

`idea_vs_market_agent.py` should be prompted explicitly to stress-test the idea adversarially (e.g., "argue the strongest case that this idea, as pitched, fails against this market — then assess if the team could still pivot successfully").

---

### 5.6 Trust Score Agent (`agents/trust_score_agent.py`)

- Extract discrete factual claims from the deck text (LLM call: "list every specific factual claim about traction, revenue, team, or market size in this text").
- For each claim, use Tavily to attempt verification.
- Classify each claim into `known_verified`, `statistical_association` (plausible but not directly confirmed), or `unverifiable`.
- Set `contradiction_flag: true` if retrieved evidence directly conflicts with the claim.
- Never fabricate a source — if nothing is found, the claim stays `unverifiable` with `source: null`.

---

### 5.7 Adversarial Agent (`agents/adversarial_agent.py`) — build for genuine independence

**Critical constraint:** this agent must receive only the raw evidence (trust_claims, axis_scores, build_evidence) — **not** the memo agent's generated bull-case text or reasoning. Implement this as a completely separate function call with its own prompt, called independently, so the two views can genuinely disagree rather than one softening the other.

Prompt it to construct the strongest case *against* investing, using only the same underlying evidence the memo agent has access to.

---

### 5.8 Memo Agent (`agents/memo_agent.py`)

Generate a structured memo with these **required** sections (per the original brief's Appendix 1):
- Company snapshot
- Investment hypotheses
- SWOT
- Problem & product
- Traction & KPIs

Optional sections (include if data supports them, otherwise explicitly flag as missing — e.g., `"cap_table": "not disclosed"`): Team & history, Technology & defensibility, Market sizing, Competition, Financials & round structure, Cap table, Due diligence log, Exit perspective.

**Rule:** every factual claim in the memo must carry an inline reference back to its `trust_claims` entry (claim text + confidence + source). Do not generate memo prose that asserts something not traceable to a trust_claim or axis_score rationale.

---

### 5.9 Memory / Founder Score persistence (`memory/store.py`, `memory/models.py`)

- SQLite table: `founders` (keyed by a stable identity, e.g., resolved name + email if available — for hackathon scope, `founder_id` is sufficient).
- On each pipeline run, check if a founder record already exists (by name/entity match). If so, load prior `founder_score.history` and axis scores before this run, and update rather than overwrite.
- `founder_score` calculation for hackathon scope: a simple weighted function of axis scores + trust score average + build evidence tier is sufficient — document the formula clearly in the README rather than over-engineering it.
- Every update appends to `founder_score.history` rather than replacing it — this is what powers the trend arrows in the dashboard.

---

### 5.10 Cold-Start Handling

- If a founder record has no GitHub history, no funding history, and no accelerator record (check these three fields), trigger a fallback: use Tavily to search for the founder's public writing/engagement (Twitter/X, personal blog, relevant community posts) as a lower-confidence proxy signal.
- Explicitly label any score derived this way with `"confidence_basis": "public_footprint_fallback"` so it's visibly distinguished from track-record-based scoring in the UI.
- Include one synthetic founder profile (`founder_04_delta_coldstart.json`) specifically designed to trigger this path — no GitHub, no funding, no accelerator, but has a plausible public footprint to fall back on.

---

### 5.11 Speed Instrumentation

- Every `FounderRecord.timing` field should be populated in real time as the pipeline runs (use `utils/timing.py` as a simple context-manager/decorator wrapper around each agent call).
- The dashboard must display: "Signal detected → Memo ready: X minutes Y seconds" per founder, computed live, not hardcoded.

---

## 6. API Layer (`api/main.py`, `api/routes.py`)

Minimal FastAPI endpoints:

- `POST /founders/inbound` — accept a new inbound application (company_name + deck_text), runs the full pipeline synchronously (fine for hackathon scale), returns the populated FounderRecord.
- `GET /founders` — list all founder records with axis scores and founder_score for the dashboard's ranked list.
- `GET /founders/{id}` — full record.
- `GET /founders/{id}/memo` — memo + adversarial view side by side.
- `GET /founders/{id}/build-evidence` — the build evidence log specifically, for its own dashboard panel.

---

## 7. Streamlit Dashboard (`ui/dashboard.py`)

Three views, navigable via sidebar or tabs:

1. **Ranked List** — table of all founders, sorted by founder_score, with trend arrows (↑/→/↓), source_channel badge, and elapsed time from signal to memo-ready.
2. **Memo View** — select a founder, show the structured memo on the left and the adversarial view on the right, side by side. Every claim shows its confidence tag inline (e.g., a colored badge: green=verified, yellow=statistical, red=unverifiable).
3. **Build Evidence Panel** — select a founder, show the build_evidence tier prominently (large badge: Verified-Working / Verified-Submitted / Unverifiable) plus the full evidence_log showing every signal checked and what was found — this is your key demo screen for the differentiator.

Keep styling functional, not elaborate — Streamlit's defaults are fine. Do not spend build time on custom CSS.

---

## 8. Demo Script (`run_demo.py`)

Build a single script that:
1. Loads all 5 synthetic founder profiles from `data/synthetic_founders/`.
2. Runs each through the full pipeline (Sourcing → Entity Resolution → Thesis Match → 3-Axis Scoring → Build Evidence → Trust Score → Memo → Adversarial) sequentially, printing timing at each stage.
3. Persists all results to the SQLite store.
4. Prints a final summary table (name, founder_score, axis scores, build_evidence tier, elapsed time) to console.

This script is what proves the pipeline works end-to-end before touching the dashboard — build and run it before building the Streamlit UI.

---

## 9. Synthetic Data Requirements

Build exactly 5 profiles in `data/synthetic_founders/`, each as a JSON file matching a simplified version of the raw_inputs schema:

1. **Alpha** — strong, well-documented founder: real-looking GitHub activity, clear traction claims, should score well across all axes.
2. **Beta** — mixed signal: decent founder traits, weak/contested market claims (should trigger contradiction_flag on at least one trust claim), to demonstrate the Trust Score agent catching an overstated claim.
3. **Gamma** — a "spin" profile: strong-sounding deck language but claims that don't hold up under Tavily verification (mostly `unverifiable` or contradicted trust_claims) — demonstrates the system isn't fooled by polish.
4. **Delta (cold-start)** — no GitHub, no funding, no accelerator, but has a plausible public footprint (Twitter/blog) — demonstrates Section 5.10.
5. **Epsilon (build-check pair)** — actually needs to be **two** profiles, both claiming a hackathon build:
   - Epsilon-A: has a real-looking Devpost submission + working demo URL → resolves to `verified_working`
   - Epsilon-B: same claim, no findable submission or URL → resolves to `unverifiable`

(This means 6 files total — adjust the file list in Section 3 accordingly: add `founder_05_epsilon_a_buildcheck.json` and `founder_06_epsilon_b_buildcheck.json`.)

---

## 10. Build Order (follow sequentially, commit after each numbered step)

1. Scaffold directory structure, `requirements.txt`, `.env.example`, `.gitignore`. Write `founder_record.schema.json`.
2. Write all 6 synthetic founder profiles (Section 9).
3. Build `memory/models.py` and `memory/store.py` (SQLite layer) — test with dummy inserts.
4. Build `utils/openai_client.py` and `utils/tavily_client.py` — thin wrappers with error handling, tested against a trivial call each.
5. Build `sourcing_agent.py` and `entity_resolution_agent.py` — run against all 6 synthetic profiles, confirm records populate correctly.
6. Build `thesis_matching_agent.py` — confirm screening logic works (test with one profile deliberately outside the default thesis).
7. Build the three axis-scoring agents (`founder_axis_agent.py`, `market_axis_agent.py`, `idea_vs_market_agent.py`) — run and inspect outputs for all 6 profiles.
8. **Build `build_evidence_agent.py`** — this is the priority differentiator, give it real attention. Test specifically against the Epsilon-A/Epsilon-B pair to confirm the tier distinction works correctly.
9. Build `trust_score_agent.py` — confirm it correctly flags Gamma's overstated claims and Beta's contested claim.
10. Build `memo_agent.py` and `adversarial_agent.py` — confirm the adversarial view is generated independently (spot-check that it isn't just restating the memo's risks section).
11. Implement cold-start fallback logic (Section 5.10) — confirm it triggers correctly for Delta.
12. Implement speed instrumentation (`utils/timing.py`) wired into every agent call.
13. Build `run_demo.py` — run full pipeline end-to-end on all 6 profiles, verify output makes sense, fix any breakage found here before moving to UI.
14. Build the FastAPI layer (`api/main.py`, `api/routes.py`).
15. Build the Streamlit dashboard (`ui/dashboard.py`) — all three views.
16. Write `README.md`: setup instructions, architecture summary, the founder_score formula used, and known limitations/what was deprioritized under time constraints.
17. Final pass: run the full demo end-to-end one more time from a clean database to confirm nothing is broken, then tag a git commit as the submission checkpoint.

---

## 11. Environment Setup (`.env.example`)

```
OPENAI_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
```

---

## 12. Explicit Non-Goals (do not build these — out of scope for hackathon time)

- Portfolio monitoring, follow-on decision logic, fund operations, or exit modeling
- A full production-grade auth system or multi-tenant support
- Real-time continuous background scanning (the outbound sourcing agent can run synthetic/on-demand rather than as a live daemon)
- The full Sourcing & Network Intelligence graph (Stretch Goal 3 from the original brief) — document the concept in the README as a documented future direction instead of building it
- A custom-styled frontend beyond Streamlit's defaults

---

## 13. Definition of Done

The build is complete when `run_demo.py` runs end-to-end on all 6 synthetic profiles with no errors, the Streamlit dashboard displays all three views with real (not hardcoded) data pulled from the SQLite store via the FastAPI layer, and the Epsilon-A/Epsilon-B pair visibly resolves to different build_evidence tiers in the UI. Everything else is a bonus on top of that working baseline.