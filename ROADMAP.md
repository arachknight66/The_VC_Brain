# Roadmap

This roadmap is the project tracker. It reflects the current repository skeleton and the intended implementation path.

## Phase 1: Foundation

Goal: make the project runnable and easy to extend.

Deliverables:

- FastAPI backend skeleton
- React frontend skeleton
- Docker Compose stack
- PostgreSQL service
- environment configuration
- route, DTO, domain, application, infrastructure structure

Dependencies:

- none

Completion status:

- Status: partial
- Skeleton exists; runtime health checks and real startup validation remain.

Future improvements:

- add backend health route
- add frontend health dashboard
- add CI commands that actually run tests/builds

## Phase 2: Discovery

Goal: collect raw founder/startup signals before activation.

Deliverables:

- GitHub scanner
- Product Hunt scanner
- Hacker News scanner
- arXiv scanner
- patent scanner
- accelerator scanner
- signal storage
- signal deduplication
- outreach queue

Dependencies:

- Search Intelligence
- scheduler/jobs structure
- signal tables

Completion status:

- Status: planned
- Folder structure exists; services and tables remain.

Future improvements:

- add source quality scoring for scanner channels
- add configurable fund thesis filters for scanner jobs

## Phase 3: Data Collection

Goal: collect and normalize evidence after founder activation.

Deliverables:

- inbound application intake
- pitch upload
- pitch deck parser
- source connectors
- source metadata
- citation storage
- raw artifact storage

Dependencies:

- company/founder records
- source/citation/evidence schema
- file upload policy

Completion status:

- Status: planned
- Search Intelligence architecture exists; source-specific connectors remain.

Future improvements:

- add document parsing quality scores
- add source refresh policies per evidence type

## Phase 4: AI Intelligence

Goal: run isolated agents that produce structured, evidence-backed outputs.

Deliverables:

- entity resolution agent
- thesis matching agent
- founder agent
- market agent
- idea-vs-market agent
- evidence agent
- trust agent
- adversarial agent
- memo agent
- memory update agent
- agent run tracking

Dependencies:

- OpenAI configuration
- Search Intelligence
- evidence and citation storage
- agent output schemas

Completion status:

- Status: planned
- Agent folders exist; implementations, prompts, schemas, and persistence remain.

Future improvements:

- add prompt versioning
- add agent replay from stored inputs
- add evaluator tests for hallucination prevention

## Phase 5: Recommendation

Goal: produce explainable, deterministic recommendations.

Deliverables:

- score components
- founder score
- market score
- execution score
- trust score
- momentum score
- idea-market fit score
- recommendation rules
- rule trace

Dependencies:

- evidence confidence
- trust scores
- scorecard schema

Completion status:

- Status: planned
- Domain/application folders exist; formulas and persistence remain.

Future improvements:

- make weights configurable by fund thesis
- add recommendation diff over time

## Phase 6: Frontend

Goal: provide a polished investor workspace for the demo.

Deliverables:

- dashboard
- signal activation screen
- application intake screen
- founder profile
- company profile
- evidence explorer
- diligence workspace
- scorecards
- recommendation screen
- investment memo
- adversarial review
- timeline
- learning/memory screen

Dependencies:

- backend APIs
- design system setup
- demo fixtures

Completion status:

- Status: planned
- Pages and feature folders exist; UI implementation remains.

Future improvements:

- add keyboard-friendly diligence review
- add print/export view for memos

## Phase 7: Testing

Goal: make core behavior reproducible and safe to change.

Deliverables:

- backend unit tests
- agent fixture tests
- search integration tests with mocked Tavily responses
- frontend workflow tests
- migration validation
- demo smoke test

Dependencies:

- implemented services
- stable fixtures

Completion status:

- Status: planned
- Test directories exist; tests remain.

Future improvements:

- add golden-file memo tests
- add performance tests for search fan-out and ranking

## Phase 8: Deployment

Goal: run the complete demo reliably.

Deliverables:

- Docker Compose local stack
- production compose profile
- environment documentation
- seed/demo data
- demo script

Dependencies:

- implemented vertical path
- API keys
- stable database migrations

Completion status:

- Status: partial
- Docker files exist; full app runtime and demo data remain.

Future improvements:

- deploy frontend to Vercel
- deploy backend/Postgres to Render, Fly.io, or Railway
- add basic monitoring
