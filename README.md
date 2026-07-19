# The VC Brain

The VC Brain is a founder-sourcing and investment-intelligence platform. It combines public signal scanners, pitch intake, evidence collection, specialized analysis agents, SQLite memory, FastAPI, and a Next.js investor workspace.

## What is implemented

- GitHub repository scanning through the GitHub Search API.
- Public X/Twitter, Substack, Devpost, and LinkedIn discovery through domain-scoped Tavily searches.
- Normalized raw-signal storage in SQLite with source, URL, timestamp, score, query, and provider payload.
- PDF, TXT, and Markdown pitch upload with type, size, parse, and empty-content validation.
- Founder and company record creation from an uploaded pitch.
- Public LinkedIn evidence collection attached to the founder record.
- Entity resolution, thesis screening, founder/market/idea scoring, trust checks, memo generation, and adversarial analysis.
- A Next.js interface for running scanners and submitting pitches.

LinkedIn and X support only accesses public pages returned by a search provider. It does not sign in, bypass access controls, or scrape private profile data.

## Architecture

```text
Scanner UI → POST /scanners/run → scanner orchestrator
  → GitHub API / Tavily → normalized signals → SQLite → API response → UI

Pitch UI → POST /founders/inbound/upload → validated text extraction
  → FounderRecord → public LinkedIn evidence → analysis pipeline
  → SQLite founder memory → API response → UI
```

The core persistence contracts are:

- `memory/models.py` and `data/schema/founder_record.schema.json` for analyzed founders.
- `memory/signals.py` and `memory/signal_store.py` for raw scanner signals.

## Local setup

Python 3.11+ and Node.js 22+ are recommended.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `OPENAI_API_KEY` and `TAVILY_API_KEY` in `.env`. GitHub search works without authentication at the public rate limit; set an optional `GITHUB_TOKEN` in your shell for a higher limit.

Run the backend:

```powershell
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

Run the Next.js frontend:

```powershell
cd frontend
npm install
$env:NEXT_PUBLIC_VC_BRAIN_API_URL="http://localhost:8000"
npm run dev
```

If the frontend uses another origin, set `VC_BRAIN_ALLOWED_ORIGINS` for the API as a comma-separated list.

## Scanner usage

Run all scanners from the CLI:

```powershell
python run_scanners.py "AI infrastructure" --limit 5
```

Run selected sources:

```powershell
python run_scanners.py "developer tools" --sources github linkedin devpost
```

API example:

```http
POST /scanners/run
Content-Type: application/json

{
  "query": "AI infrastructure",
  "sources": ["github", "x", "substack", "devpost", "linkedin"],
  "max_results": 8
}
```

Retrieve persisted signals with `GET /signals`, or filter with `GET /signals?source=github&limit=25`.

## Frontend metric contract

The Next.js dashboard reads persisted data from `GET /founders`, `GET /signals`, and
`GET /dashboard/summary`. Frontend terminology mirrors the backend contract:

- **Founder Score** is the persistent weighted ranking metric.
- **Founder Axis**, **Market Axis**, and **Idea-vs-Market Axis** remain independently visible.
- **Score Confidence** is `founder_score.confidence`; it is not another score.
- **Trust Claim Confidence** is calculated from claim-level confidence values.
- **Build Evidence** uses the backend tiers `verified_working`, `verified_submitted`,
  `unverifiable`, and `not_applicable`.
- **Raw Signals** are unconfirmed Stage 0 scanner results.
- **Signal → Memo** is the measured pipeline elapsed time.

Dashboard, Founder Discovery, Company Analysis, and Trust Claim Verification use API records by
default. The original demo founders and signals are retained as a disabled fixture. To enable them
temporarily for a frontend-only demo:

```powershell
cd frontend
$env:NEXT_PUBLIC_USE_MOCK_DATA="true"
npm run dev
```

Leave the variable unset, or set it to `false`, to use the integrated FastAPI data path. The mock
fixture is never used as an automatic fallback for API failures, so backend integration problems
remain visible.

## Pitch upload

`POST /founders/inbound/upload` accepts multipart form data:

- Required: `name`, `company_name`, `pitch`.
- Optional: `linkedin_url`, `github_handle`, `sector`, `stage`, `geography`.
- Accepted files: PDF, TXT, and Markdown.
- Maximum size: 10 MB.

The uploaded file is processed in memory. Raw file bytes are not persisted; extracted text and source metadata are stored in the founder record.

The existing JSON intake remains available at `POST /founders/inbound`.

## Tests

```powershell
pytest -q
cd frontend
npm test
npm run lint
```

Scanner tests mock external providers and verify normalization, domain filtering, persistence, deduplication, and LinkedIn evidence. Frontend tests verify server rendering and both live API integrations.

## Operational behavior

- External scanner failure is isolated by source; one failed provider does not discard successful signals from other providers.
- Missing Tavily credentials produce no web results rather than fabricated evidence.
- GitHub request failures are logged and return an empty result set.
- Repeated scanner results are deduplicated by source and external ID.
- Founder records and their historical score entries remain in SQLite across runs.

Detailed endpoint, schema, and provider behavior is documented in [docs/SCANNERS_AND_INTAKE.md](docs/SCANNERS_AND_INTAKE.md).
