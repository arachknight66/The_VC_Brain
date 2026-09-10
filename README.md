# THE VC BRAIN — Evidence-First Venture Intelligence System

**VC Brain** is an AI-first system that sources, scores, and produces evidence-backed investment memos for startup founders — compressing Sourcing → Screening → Diligence → Decision into a fast, auditable pipeline. Built as specified in [`build.md`](./build.md) for Hack-Nation's 6th Global AI Hackathon (Track 02: Maschmeyer Group).

---

## Primary Interface

The reference implementation and primary evaluation interface matching **build.md Section 7** is the **Streamlit dashboard**:

- **Location:** [`ui/dashboard.py`](./ui/dashboard.py)
- **Execution:**
  ```bash
  # Terminal 1: Start the FastAPI service
  uvicorn api.main:app --host 0.0.0.0 --port 8000

  # Terminal 2: Launch the Streamlit dashboard
  streamlit run ui/dashboard.py
  ```
- **Features:**
  1. **Investor Dashboard (View 1):** Scored founder cards, 3-axis radar comparisons, build-evidence badges, timing metrics.
  2. **Full Memo View (View 2):** Complete investment memo with executive summary, team analysis, and source evidence citations.
  3. **Adversarial View (View 3):** Fully independent bear-case analysis deliberately isolated from the bull-case memo reasoning chain.

### Supplementary Next.js Frontend

The Next.js workspace in [`frontend/`](./frontend/) is a supplementary UI. As of this repository cleanup, it is wired exclusively to genuine, non-mocked backend endpoints (`/founders`, `/dashboard/summary`, `/signals`, `/scanners/run`, `/signals/review`, `/founders/inbound/upload`, `/founders/{id}/memo`, `/founders/{id}/build-evidence`, `/founders/{id}/chat`, and `/founders/{id}/investor-briefing`) with zero dependency on fake or static JSON routes.

---

## Core Differentiators

1. **Independent 3-Axis Scoring:** Non-averaged evaluation across Founder, Market, and Idea-vs-Market axes.
2. **Per-Claim Trust Score:** Granular claim verification with citation URLs and contradiction flags rather than a single collapsed company score.
3. **Dedicated Build Evidence Agent:** Verifies whether a founder has actually built functional software (e.g. Devpost submissions, working demo URLs, GitHub releases) even without public code repositories. Resolves to distinct tiers: `verified_working`, `code_present_unverified`, or `unverifiable`.
4. **Independent Adversarial Agent:** Operates with no shared context with the bull-case memo generator, stress-testing unit economics, competitive threats, and founder blindspots.
5. **Cold-Start Handling:** Fallback heuristics analyzing public digital footprints (technical blog posts, community signals) when traditional track records are absent.
6. **Speed & Provenance Instrumentation:** Live wall-clock and stage timing tracking signal-to-memo generation latency.
7. **Persistent Founder Memory:** SQLite persistence storing canonical profiles, longitudinal score trajectories, and evidence ledgers.

---

## System Architecture

```
The_VC_Brain/
├── agents/                      # Python agent pipeline
│   ├── sourcing_agent.py        # Intake from inbound pitch and outbound scanners
│   ├── entity_resolution_agent.py # Entity deduplication and domain canonicalization
│   ├── thesis_matching_agent.py # Stage 1 screening gate
│   ├── founder_axis_agent.py    # Axis 1: Founder pedigree & technical velocity
│   ├── market_axis_agent.py     # Axis 2: TAM, market tailwinds, category timing
│   ├── idea_vs_market_agent.py  # Axis 3: Product-market fit & defensibility
│   ├── build_evidence_agent.py  # Proof-of-build verification & tier classification
│   ├── trust_score_agent.py     # Fact-checking & contradiction detection
│   ├── memo_agent.py            # Bull-case investment memo synthesis
│   ├── adversarial_agent.py     # Independent bear-case counter-thesis
│   └── investor_chat_agent.py   # Multi-pass interactive investor briefing & Q&A
├── memory/                      # SQLite storage and domain models
│   ├── models.py                # FounderRecord, AxisScore, TrustClaim, Signal
│   ├── store.py                 # SQLite CRUD and longitudinal score tracking
│   ├── signal_store.py          # Scanner signal persistence
│   └── scoring.py               # Composite founder score algorithm
├── scanners/                    # Outbound sourcing scanners
│   ├── orchestrator.py          # Multi-source sourcing runner (GitHub, web, launches)
│   ├── github_scanner.py        # GitHub repository and developer signal ingestion
│   └── web_scanner.py           # Web and launch announcement scanner
├── api/                         # FastAPI application
│   ├── main.py                  # App entrypoint and CORS middleware
│   └── routes.py                # REST endpoints (/founders, /signals, /scanners, etc.)
├── ui/                          # Streamlit reference interface
│   └── dashboard.py             # Reference 3-view investor workspace
├── data/
│   ├── synthetic_founders/      # 6 benchmark synthetic founder profiles
│   └── schema/                  # JSON schema specifications
├── frontend/                    # Supplementary Next.js workspace
├── tests/                       # Pytest test suite
├── run_demo.py                  # End-to-end pipeline CLI runner
└── experimental-scale-mockup/   # Quarantined non-functional C++ architecture sketch
```

---

## Quick Start

### 1. Prerequisites & Environment Setup

- Python 3.11+
- Node.js 22+ (if running the supplementary Next.js frontend)

Create a virtual environment and install requirements:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Configure environment keys in `.env` (optional — offline fallback heuristics run automatically when keys are omitted):
```bash
cp .env.example .env
# OPENAI_API_KEY=your_key_here
# TAVILY_API_KEY=your_key_here
```

### 2. Run End-to-End Demo

Process all 6 synthetic founder profiles end-to-end through the complete agent pipeline into a clean SQLite store:
```bash
python run_demo.py --reset
```

### 3. Run Automated Tests

Run the Python pipeline test suite:
```bash
pytest tests/
```

Run the Next.js frontend tests:
```bash
cd frontend
npm test
```

### 4. Launch the Interfaces

- **Streamlit Dashboard (Primary):**
  ```bash
  uvicorn api.main:app &
  streamlit run ui/dashboard.py
  ```
- **Next.js Frontend (Supplementary):**
  ```bash
  cd frontend
  npm run dev
  ```

---

## Quarantined Code Notice

The directory [`experimental-scale-mockup/`](./experimental-scale-mockup/) contains an exploratory C++23 enterprise architecture sketch that is **NOT** part of the graded hackathon submission, is not built or wired to the running system, and should be disregarded when evaluating THE VC BRAIN.
