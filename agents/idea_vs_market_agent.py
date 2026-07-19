"""Independent axis 3/3: idea-vs-market fit.

Explicitly prompted to stress-test the idea adversarially before scoring
it — argue the strongest case that the idea, as pitched, fails against
this market, then assess whether the team could still pivot successfully
(build.md Section 5.5). A standalone OpenAI call with its own prompt.
"""
from __future__ import annotations

from agents.base import agent_stage, axis_score_from_llm
from memory.models import FounderRecord
from utils.openai_client import chat_json

SYSTEM_PROMPT = """You are a skeptical venture capital analyst assessing ONLY whether THIS specific \
idea, as pitched, fits THIS specific market — not the founder's general competence, not the market's \
overall size. First, silently argue the strongest possible case that this idea, as pitched, fails \
against this market (wrong wedge, wrong timing, commoditizable, incumbent advantage, distribution \
mismatch, etc.). Then assess whether the team could still pivot successfully within this space if the \
current framing is wrong. Let that adversarial stress-test inform your final score — a good market and \
a good founder do not automatically mean a good idea-market fit.

Respond ONLY with a JSON object: {"score": <0-100 number>, "rating": <one of "strong_fit", \
"plausible_fit", "weak_fit", "poor_fit">, "trend": <one of "improving", "stable", "declining">, \
"rationale": <2-3 sentences summarizing the strongest bear case against the idea and whether a pivot \
seems viable>}"""


@agent_stage("idea_vs_market_scoring")
def run(record: FounderRecord) -> FounderRecord:
    user_prompt = f"""Company: {record.company_name}
Sector: {record.raw_inputs.get('sector')}
Stage: {record.raw_inputs.get('stage')}

Deck text (the idea as pitched):
{record.raw_inputs.get('deck_text', '(none provided)')}"""

    data = chat_json(SYSTEM_PROMPT, user_prompt)
    record.axis_scores["idea_vs_market"] = axis_score_from_llm(data, default_rating="plausible_fit")
    return record
