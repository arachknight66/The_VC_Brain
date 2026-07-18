# The VC Brain

The VC Brain is an AI-powered venture intelligence platform that helps investors discover founders before fundraising, collect evidence-backed diligence, generate explainable recommendations, and produce professional investment memos.

The project is optimized for a hackathon MVP: one developer or small team should be able to build a polished end-to-end demo without introducing enterprise complexity.

## Problem Statement

Early-stage venture discovery is noisy, biased, and slow. Strong technical founders often appear first in public signals such as GitHub repositories, Hacker News launches, research papers, accelerator cohorts, patents, and hackathons, not in warm investor networks.

The VC Brain turns those fragmented public signals into an evidence-backed investor workspace. It keeps every claim traceable, every score explainable, and every recommendation grounded in cited evidence.

## Why This Exists

The system is designed around one principle:

> AI assists reasoning, but deterministic backend logic owns business decisions.

AI agents extract, classify, summarize, verify, and draft. The backend owns scoring formulas, confidence rules, recommendation thresholds, traceability, and persistence.

## Key Features

- Continuous discovery from public founder and startup signals
- Inbound pitch activation and outbound signal activation
- Tavily-powered Search Intelligence layer
- Source-specific data collection from GitHub, Product Hunt, Hacker News, arXiv, patents, accelerators, Crunchbase, and LinkedIn
- Evidence extraction with citations and confidence
- Specialized AI agents for entity resolution, thesis matching, founder analysis, market analysis, trust scoring, memo generation, and adversarial review
- Deterministic scorecards and investment recommendations
- Investor workspace with dashboard, profiles, diligence view, evidence explorer, memo, and adversarial view
- Founder memory and learning loop for investment outcomes and source quality

## High-Level Workflow

```text
Stage 0: Continuous discovery agents collect raw signals
Stage 1: Founder enters through inbound application or outbound activation
Stage 2: Data collection gathers pitch, web, technical, launch, funding, and research evidence
Stage 3: AI agents analyze evidence and deterministic services score/recommend
Stage 4: Investor reviews a decision-ready workspace and cited memo
Stage 5: Decision outcome updates memory and improves future sourcing
```

## Architecture Summary

The repository uses a modular monolith:

- `frontend/` contains the React investor workspace.
- `backend/` contains the FastAPI application, domain model, agents, search intelligence, and integrations.
- `database/` contains database migration areas and schema support.
- `prompts/` contains reviewable prompt templates.
- `test-data/`, `integration-tests/`, and `performance-tests/` support validation.

Tavily is treated as a Search Intelligence provider behind a provider-neutral port. Agents use structured search results, not raw Tavily responses.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, TailwindCSS, shadcn/ui |
| Backend | Python 3.12, FastAPI, Pydantic |
| Database | PostgreSQL, Alembic-style migrations |
| AI | OpenAI API, Structured Outputs, function-style structured calls |
| Search | Tavily API as default provider |
| Deployment | Docker, Docker Compose |
| Testing | Pytest, frontend unit/integration/e2e test structure |

## Repository Structure

```text
backend/app/
  agents/                  Specialized AI agents
  api/                     FastAPI routes, DTOs, mappers, errors
  application/             Use-case orchestration services
  domain/                  Business objects and deterministic rules
  infrastructure/          Search, AI, persistence, cache, jobs, security
  port/                    Provider-neutral interfaces

frontend/src/
  pages/                   Route-level screens
  features/                Product features and workflows
  api/                     Typed API clients
  components/              Shared UI components

database/
  migrations/              Stage-based schema migration areas

prompts/
  claim-extraction/
  claim-verification/
  memo-generation/
  memo-validation/
  query-generation/
  search-planning/
```

## Quick Start

1. Copy the environment file.

```bash
cp .env.example .env
```

2. Fill in required API keys.

```text
OPENAI_API_KEY=
TAVILY_API_KEY=
```

3. Start the stack.

```bash
docker compose up --build
```

Expected local services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

## Local Development

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Docker

The default compose file runs PostgreSQL, backend, and frontend.

```bash
docker compose up --build
```

Use overrides for environment-specific behavior:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `APP_ENV` | Runtime environment |
| `DATABASE_URL` | PostgreSQL connection URL |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | Default OpenAI model |
| `TAVILY_API_KEY` | Tavily API key |
| `TAVILY_BASE_URL` | Tavily API base URL |
| `TAVILY_TIMEOUT_SECONDS` | Tavily request timeout |
| `TAVILY_MAX_RETRIES` | Tavily retry limit |
| `APP_API_KEY` | Optional API protection key |
| `VITE_API_BASE_URL` | Frontend API base URL |

## Demo Overview

The recommended hackathon demo follows one complete vertical path:

```text
Signal or pitch input
-> activated founder/company
-> evidence collection
-> agent analysis
-> scorecards
-> adversarial view
-> cited investment memo
-> investor decision
-> memory update
```

## Screenshots

Screenshots will be added as the frontend implementation lands.

- Dashboard
- Evidence Explorer
- Diligence Workspace
- Investment Memo
- Adversarial View

## Contributors

- Bhargavi Kurukunda
- Nikita
- Daksh

## License

This project is licensed under the MIT License. See `LICENSE`.
