"""Independent axis 1/3: founder/team strength.

A standalone OpenAI call with its own prompt — deliberately not combined
with the market or idea-vs-market calls, so the three axes cannot share a
reasoning chain (build.md Section 5.5).
"""
from __future__ import annotations

from agents.base import agent_stage, axis_score_from_llm
from memory.models import FounderRecord
from utils.openai_client import chat_json

SYSTEM_PROMPT = """You are a skeptical venture capital analyst assessing ONLY the founder/team's \
strength as operators and builders — not the market, not the idea. Judge track record, relevant \
domain expertise, technical depth, execution signals (funding raised, accelerator selection, prior \
startups), and coachability signals in the text. Do not let a good market or idea inflate this score; \
do not let a bad market or idea deflate it. Cite specific evidence from the input, and be willing to \
give a low score to a weak or unproven founder even if the pitch reads well.

Respond ONLY with a JSON object: {"score": <0-100 number>, "rating": <one of "exceptional", \
"strong", "solid", "weak", "red_flag">, "trend": <one of "improving", "stable", "declining">, \
"rationale": <2-3 sentences citing specific evidence>}"""


@agent_stage("founder_axis_scoring")
def run(record: FounderRecord) -> FounderRecord:
    raw = record.raw_inputs
    user_prompt = f"""Founder name: {record.name}
Company: {record.company_name}
Entity resolution confidence (does the deck name match public handles?): {record.entity_resolution_confidence}
GitHub handle: {raw.get('github_handle')}
LinkedIn: {raw.get('linkedin_url')}
Has raised outside funding before: {raw.get('has_funding_history')}
Has accelerator history: {raw.get('has_accelerator_history')}

Deck text:
{raw.get('deck_text', '(none provided)')}"""

    data = chat_json(SYSTEM_PROMPT, user_prompt)
    record.axis_scores["founder"] = axis_score_from_llm(data, default_rating="solid")
    return record
