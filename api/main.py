"""FastAPI app entrypoint (build.md Section 6)."""
from __future__ import annotations

import os
import secrets

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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


@app.middleware("http")
async def require_service_token(request: Request, call_next):
    """Reject direct production API access when a server-to-server token is configured."""
    expected = os.getenv("VC_BRAIN_SERVICE_TOKEN", "").strip()
    if (
        expected
        and request.url.path != "/health"
        and not secrets.compare_digest(
            request.headers.get("x-vc-brain-service-token", ""),
            expected,
        )
    ):
        return JSONResponse(status_code=401, content={"detail": "Invalid service credentials"})
    return await call_next(request)


app.include_router(router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
