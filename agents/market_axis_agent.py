"""Independent axis 2/3: market attractiveness.

Pulls 2-3 comparable companies via Tavily before scoring, so the rating is
grounded in retrieved evidence rather than pure LLM prior knowledge
(build.md Section 5.5). A standalone OpenAI call with its own prompt.
"""
from __future__ import annotations

from agents.base import agent_stage, axis_score_from_llm
from memory.models import FounderRecord
from utils.openai_client import chat_json
from utils.tavily_client import search

SYSTEM_PROMPT = """You are a skeptical venture capital analyst assessing ONLY the attractiveness of \
the target market — not the founder, not the idea's specific execution. Judge market size and \
growth trajectory, competitive intensity (using the retrieved comparable companies below as ground \
truth where available), timing, and structural tailwinds/headwinds. Do not let a strong founder or a \
clever product angle inflate this score. If no comparable data was retrieved, say so explicitly and \
rely on cautious general knowledge rather than fabricating specifics.

Respond ONLY with a JSON object: {"score": <0-100 number>, "rating": <one of "bullish", "neutral", \
"bear">, "trend": <one of "improving", "stable", "declining">, "rationale": <2-3 sentences, \
referencing the comparables if any were retrieved>}"""


@agent_stage("market_axis_scoring")
def run(record: FounderRecord) -> FounderRecord:
    sector = record.raw_inputs.get("sector") or record.company_name
    query = f"{sector} startups market size competitors 2025"
    results = search(query, max_results=3)

    if results:
        comparables_text = "\n".join(
            f"- {r.get('title', 'untitled')}: {(r.get('content') or '')[:250]}" for r in results
        )
    else:
        comparables_text = "(no comparable company data retrieved via web search)"

    user_prompt = f"""Company: {record.company_name}
Sector: {sector}
Stage: {record.raw_inputs.get('stage')}
Geography: {record.raw_inputs.get('geography')}

Deck text:
{record.raw_inputs.get('deck_text', '(none provided)')}

Retrieved comparable companies / market context (via web search):
{comparables_text}"""

    data = chat_json(SYSTEM_PROMPT, user_prompt)
    record.axis_scores["market"] = axis_score_from_llm(data, default_rating="neutral")
    return record
