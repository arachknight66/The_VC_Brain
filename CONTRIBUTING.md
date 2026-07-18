# Contributing

This document explains how to become productive quickly.

## Development Philosophy

Build one vertical workflow at a time. Prefer traceable, working slices over broad shallow integrations.

Rules:

- Keep AI output structured and validated.
- Keep business decisions deterministic.
- Keep evidence and citations attached to claims.
- Keep modules small and named after workflow responsibilities.
- Do not add abstractions unless they remove real ambiguity or duplication.

## Coding Standards

Backend:

- Python 3.12
- FastAPI route modules in `backend/app/api/routes`
- Pydantic models for DTOs and domain-facing structured data
- Application services in `backend/app/application`
- Domain rules in `backend/app/domain`
- External systems in `backend/app/infrastructure`
- Provider interfaces in `backend/app/port`

Frontend:

- React 19 with TypeScript
- Feature code in `frontend/src/features/<feature>`
- Route-level screens in `frontend/src/pages`
- Shared API clients in `frontend/src/api`
- Shared UI in `frontend/src/components`

## Branch Strategy

Use short-lived branches:

```text
feature/<area>-<description>
fix/<area>-<description>
docs/<description>
```

Examples:

```text
feature/search-query-generation
feature/evidence-explorer
fix/tavily-timeout-handling
```

## Pull Request Workflow

Every PR should include:

- what changed
- why it changed
- how it was tested
- screenshots for frontend changes
- migration notes for database changes
- prompt/schema notes for AI changes

Keep PRs small enough to review in one sitting.

## Folder Responsibilities

| Folder | Responsibility |
|---|---|
| `backend/app/api` | HTTP boundary |
| `backend/app/application` | Workflow orchestration |
| `backend/app/domain` | Business model and deterministic rules |
| `backend/app/agents` | Isolated AI agent responsibilities |
| `backend/app/infrastructure` | Providers, persistence, jobs, cache, config |
| `backend/app/port` | Interfaces for external providers |
| `frontend/src/pages` | Route-level screens |
| `frontend/src/features` | Product feature modules |
| `database/migrations` | Schema changes |
| `prompts` | Reviewable prompt templates |

## Naming Conventions

Backend:

- files: `snake_case.py`
- classes: `PascalCase`
- services: `<Capability>Service`
- agents: `<Capability>Agent`
- providers: `<Provider><Capability>Provider`
- DTOs: `<Action>Request`, `<Action>Response`

Frontend:

- components/pages: `PascalCase.tsx`
- hooks: `useSomething.ts`
- API files: `<feature>Api.ts`
- types: `camelCase` or `PascalCase` exports

## How To Add A New API

1. Add request DTO in `backend/app/api/dto/request`.
2. Add response DTO in `backend/app/api/dto/response`.
3. Add route module in `backend/app/api/routes`.
4. Call an application service.
5. Keep provider/database logic out of the route.
6. Add a frontend API function in `frontend/src/api` if needed.
7. Add tests under `backend/tests/api`.

## How To Add A New AI Agent

1. Add a folder under `backend/app/agents/<agent_name>`.
2. Define the agent input and output schema.
3. Add prompt template under `prompts/<agent-purpose>` and runtime copy under `backend/app/resources/prompts` if needed.
4. Call provider-neutral AI/search services, not raw external APIs.
5. Persist an agent run and output.
6. Validate structured output before downstream use.
7. Add fixture-based tests.

## How To Add A Database Migration

1. Choose the workflow stage folder under `database/migrations`.
2. Name the file with a monotonic prefix and clear description.
3. Include tables, indexes, constraints, and rollback notes where relevant.
4. Update domain/entity/repository skeletons in the same PR.
5. Add seed or fixture data only when it supports tests or the demo.

## How To Run Locally

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Docker:

```bash
docker compose up --build
```

## Testing Strategy

Backend:

- unit tests for deterministic services
- fixture tests for agents
- integration tests for search providers using mocked/cached responses
- migration tests for schema changes

Frontend:

- component tests for feature components
- integration tests for page workflows
- e2e tests for the demo path

Critical test targets:

- query generation is deterministic
- ranking is reproducible
- scoring is deterministic
- unsupported claims are flagged
- memo citations resolve to evidence

## Commit Message Convention

Use:

```text
type(scope): summary
```

Examples:

```text
feat(search): add deterministic query generation
feat(agents): add entity resolution skeleton
fix(evidence): preserve citation IDs during dedupe
docs(architecture): document memory loop
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.

## Code Review Checklist

- Does this preserve evidence traceability?
- Are AI outputs structured and validated?
- Is deterministic logic kept outside prompts?
- Is the module in the correct folder?
- Are external integrations behind ports/adapters?
- Are errors handled explicitly?
- Are cache and retry behaviors clear?
- Are tests or fixtures included for risky behavior?
- Does the change support the hackathon demo path?
