# The VC Brain

AI-first venture diligence system for discovering founders before fundraising, collecting evidence, producing explainable recommendations, and generating investment memos.

This repository is intentionally structured as a hackathon-ready modular monolith:

- Frontend: React 19, Vite, TypeScript, TailwindCSS, shadcn/ui
- Backend: Python 3.12, FastAPI, Pydantic
- Database: PostgreSQL with Flyway
- AI: OpenAI API with Structured Outputs
- Search: Tavily API
- Deployment: Docker and Docker Compose

The architecture treats AI output as untrusted structured input. Deterministic backend logic owns scoring, confidence calculation, recommendation rules, and traceability.

## Workflow Shape

The repository now maps directly to the full VC Brain workflow:

- Stage 0: continuous discovery scanners, raw signals, deduplication, outreach queue
- Stage 1: inbound applications, outbound activation, pitch upload, founder creation
- Stage 2: pitch deck parsing and source-specific data collection
- Stage 3: isolated intelligence agents, deterministic scoring, recommendation, memo generation
- Stage 4: investor workspace, evidence explorer, scorecards, adversarial view
- Stage 5: founder memory, investment outcomes, feedback loop, source quality, learning signals

For the hackathon MVP, the implementation should demo one complete vertical path end to end: signal or pitch input -> evidence collection -> agent analysis -> scorecard -> recommendation -> cited memo -> investor decision -> memory update.
