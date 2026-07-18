"""FastAPI app entrypoint (build.md Section 6)."""
from __future__ import annotations

from fastapi import FastAPI

from api.routes import router

app = FastAPI(
    title="VC Brain API",
    description="Sources, screens, and produces evidence-backed investment memos for startup founders.",
    version="0.1.0",
)
app.include_router(router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
