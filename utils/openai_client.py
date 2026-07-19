"""Thin wrapper around the OpenAI client used by every agent.

If OPENAI_API_KEY is missing (or a call fails), falls back to a
deterministic stub response so the pipeline still runs end-to-end
without erroring or costing money.
"""
from __future__ import annotations

import json
import logging
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

logger = logging.getLogger(__name__)

MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")
_api_key = os.environ.get("OPENAI_API_KEY")
_client = OpenAI(api_key=_api_key) if _api_key else None


def is_live() -> bool:
    return _client is not None


def chat(system_prompt: str, user_prompt: str, *, json_mode: bool = False, temperature: float = 0.4) -> str:
    """Single-turn chat completion. Returns raw text content.

    On any failure (no key, network error, API error), returns a stub
    string rather than raising, so a demo run never hard-fails on a
    missing key or a transient API error.
    """
    if _client is None:
        return _stub_response(system_prompt, user_prompt, json_mode)

    try:
        kwargs = {}
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        response = _client.chat.completions.create(
            model=MODEL,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            **kwargs,
        )
        return response.choices[0].message.content or ""
    except Exception as exc:  # noqa: BLE001 - hackathon-scope: never let an LLM outage kill the pipeline
        logger.warning("OpenAI call failed (%s); falling back to stub response", exc)
        return _stub_response(system_prompt, user_prompt, json_mode)


def chat_json(system_prompt: str, user_prompt: str, *, temperature: float = 0.4) -> dict:
    """Chat completion that guarantees a parsed dict back, even on failure."""
    raw = chat(system_prompt, user_prompt, json_mode=True, temperature=temperature)
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        logger.warning("Failed to parse JSON from model output; returning empty dict")
        return {}


def _stub_response(system_prompt: str, user_prompt: str, json_mode: bool) -> str:
    """Deterministic offline fallback used when no OPENAI_API_KEY is configured."""
    if json_mode:
        return json.dumps({
            "_stub": True,
            "note": "OPENAI_API_KEY not configured; this is a deterministic placeholder response.",
        })
    return (
        "[stub response - OPENAI_API_KEY not configured] "
        "This is a placeholder generated without a live LLM call."
    )
