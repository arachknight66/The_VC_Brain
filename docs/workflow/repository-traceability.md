# Workflow-To-Repository Traceability

This document maps the full VC Brain workflow to the repository skeleton.

## Stage 0: Continuous Discovery

- Backend application: `backend/app/application/signals`, `backend/app/application/outreach`
- Domain: `backend/app/domain/signal`, `backend/app/domain/outreach`
- Scanner integrations: `backend/app/infrastructure/integrations/*`
- Jobs: `backend/app/infrastructure/jobs/scanners`, `backend/app/infrastructure/scheduler`
- Database migration area: `database/migrations/stage0_continuous_discovery`
- Frontend: `frontend/src/features/signals`, `frontend/src/features/outreach`

## Stage 1: Activation Pipeline

- Backend application: `backend/app/application/applications`, `backend/app/application/activation`
- Domain: `backend/app/domain/application_intake`
- Upload infrastructure: `backend/app/infrastructure/storage/uploads`
- Pitch parsing: `backend/app/infrastructure/parsing/pitch_deck`
- Database migration area: `database/migrations/stage1_activation`
- Frontend: `frontend/src/features/applications`

## Stage 2: Data Collection

- Backend application: `backend/app/application/data_collection`
- Domain: `backend/app/domain/source`, `backend/app/domain/citation`, `backend/app/domain/evidence`
- Integrations: GitHub, Product Hunt, Hacker News, X/Twitter, arXiv, patents, accelerators, Crunchbase, LinkedIn
- Database migration area: `database/migrations/stage2_data_collection`
- Frontend: `frontend/src/features/evidence`

## Stage 3: Intelligence Layer

- Agents: `backend/app/agents/*`
- AI infrastructure: `backend/app/infrastructure/ai`
- Prompt library: `backend/app/resources/prompts`, `prompts`
- Application services: scoring, recommendation, memo, memory
- Domain: score, recommendation, memo, thesis, memory
- Database migration area: `database/migrations/stage3_intelligence`

## Stage 4: Investor Workspace

- Frontend pages: `frontend/src/pages`
- Frontend features: dashboard, founders, companies, diligence, evidence, memo, recommendation, adversarial, search, timeline
- Backend APIs: `backend/app/api/routes`
- Database migration area: `database/migrations/stage4_workspace`

## Stage 5: Learning Loop

- Backend application: `backend/app/application/memory`, `backend/app/application/outcomes`, `backend/app/application/feedback`, `backend/app/application/source_quality`
- Domain: `backend/app/domain/memory`, `backend/app/domain/outcome`, `backend/app/domain/feedback`, `backend/app/domain/channel`, `backend/app/domain/learning`
- Learning jobs: `backend/app/infrastructure/jobs/learning`
- Database migration area: `database/migrations/stage5_learning_loop`
- Frontend: `frontend/src/features/learning`

