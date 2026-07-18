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
