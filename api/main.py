"""FastAPI app entrypoint (build.md Section 6)."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from api.routes import router

app = FastAPI(
    title="VC Brain API",
    description="Sources, screens, and produces evidence-backed investment memos for startup founders.",
    version="0.1.0",
)
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "VC_BRAIN_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
