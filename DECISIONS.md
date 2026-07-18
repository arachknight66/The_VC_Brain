# Architecture Decisions

This document records major architecture decisions so contributors do not reopen settled questions without new evidence.

## ADR 001: Use A Modular Monolith

Context:

The project needs to show a broad AI workflow during a hackathon. Microservices would add deployment and coordination overhead before the product is proven.

Decision:

Use a modular monolith with clear package boundaries.

Alternatives considered:

- microservices
- serverless functions
- separate agent workers from day one

Why chosen:

The monolith is faster to build, easier to debug, easier to demo, and still supports clean module boundaries.

Trade-offs:

- modules cannot scale independently yet
- contributors must respect package boundaries

## ADR 002: Use FastAPI For Backend

Context:

The backend needs fast iteration, strong typing through Pydantic, good async support for external APIs, and a natural fit for AI/search integrations.

Decision:

Use Python 3.12, FastAPI, and Pydantic.

Alternatives considered:

- Spring Boot
- Node.js/NestJS
- Django

Why chosen:

FastAPI gives the shortest path from architecture to working AI/search APIs while keeping explicit schemas.

Trade-offs:

- less built-in enterprise structure than Spring Boot
- team must enforce layering conventions

## ADR 003: Use Next.js And React For Frontend

Context:

The investor workspace needs a polished dashboard, evidence explorer, scorecards, memo view, and adversarial view.

Decision:

Use Next.js, React 19, TypeScript, TailwindCSS, and shadcn/ui.

Alternatives considered:

- Vue
- Vite
- plain React without shadcn/ui

Why chosen:

Next.js gives file-based routing, production-ready builds, and a clean deployment path while preserving React speed for the investor workspace. TypeScript improves API safety. shadcn/ui accelerates professional UI.

Trade-offs:

- more framework structure than Vite
- design consistency depends on disciplined component use

## ADR 004: Use Tavily As Default Search Intelligence Provider

Context:

The platform depends on web intelligence for discovery, data collection, evidence verification, market research, and memo citations.

Decision:

Use Tavily as the default search provider behind a provider-neutral `SearchProvider` port.

Alternatives considered:

- direct Google Search API
- Brave Search
- Exa
- scraping custom sources only

Why chosen:

Tavily is optimized for AI retrieval workflows and can return agent-friendly search context quickly.

Trade-offs:

- external API dependency
- rate limits and outages must be handled through cache and graceful degradation

## ADR 005: Use PostgreSQL

Context:

The system needs relational traceability across founders, companies, claims, evidence, citations, scores, recommendations, memos, and outcomes.

Decision:

Use PostgreSQL as the primary database.

Alternatives considered:

- MongoDB
- SQLite
- dedicated graph database
- vector database as primary store

Why chosen:

PostgreSQL supports relational integrity and flexible JSON fields. It is easy to run locally and deploy.

Trade-offs:

- graph-style evidence traversal requires careful schema/index design
- vector search may be added later if needed

## ADR 006: Use Deterministic Scoring

Context:

Investment recommendations must be explainable, reproducible, and evidence-backed.

Decision:

Use deterministic formulas and rule traces for scores and recommendations. AI can classify inputs and explain evidence, but it does not own final scoring.

Alternatives considered:

- ask an LLM for final investment score
- train a model
- manual-only scoring

Why chosen:

Deterministic scoring is transparent, testable, and judge-friendly.

Trade-offs:

- formulas may be less nuanced than expert judgment
- weights require iteration

## ADR 007: Use Agent-Based Intelligence

Context:

The workflow requires different reasoning passes: identity resolution, thesis matching, founder assessment, market analysis, adversarial review, evidence verification, and memo generation.

Decision:

Use isolated agents with clear inputs, outputs, prompts, and persistence.

Alternatives considered:

- one large end-to-end agent
- hardcoded non-AI pipeline only
- free-form chat interface

Why chosen:

Agent isolation improves testability, traceability, and failure handling.

Trade-offs:

- more orchestration code
- more schemas and fixtures to maintain

## ADR 008: Use Structured Outputs

Context:

Agent outputs feed downstream scoring, trust, recommendations, and memos. Free-form text is too fragile for this role.

Decision:

Use structured outputs for AI calls wherever output feeds the system.

Alternatives considered:

- plain text prompting
- regex parsing
- manual analyst entry

Why chosen:

Structured outputs make validation, persistence, and replay practical.

Trade-offs:

- schema design takes upfront effort
- prompts must be versioned carefully

## ADR 009: Use Docker Compose

Context:

The team needs a repeatable local stack for backend, frontend, and PostgreSQL.

Decision:

Use Docker Compose for local and demo orchestration.

Alternatives considered:

- local manual setup only
- Kubernetes
- cloud-only deployment

Why chosen:

Docker Compose is simple, portable, and enough for a hackathon demo.

Trade-offs:

- not a full production orchestration platform
- local volumes and environment variables must be managed carefully

## ADR 010: Use Stage-Based Database Migration Areas

Context:

The workflow has six clear stages, each with distinct data responsibilities.

Decision:

Organize database migration areas by workflow stage.

Alternatives considered:

- one flat migration directory only
- schema-per-module
- database generated entirely from ORM models

Why chosen:

Stage-based organization helps contributors understand why tables exist and which workflow they support.

Trade-offs:

- migration ordering must still be globally managed
- stage folders need naming discipline
