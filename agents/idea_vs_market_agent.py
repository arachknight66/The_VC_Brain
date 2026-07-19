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

SYSTEM_PROMPT = """You are a highly analytical, skeptical venture capital analyst assessing ONLY whether THIS specific startup idea, as pitched, fits the target market.

Evaluate the idea-market fit using the following rubric:
1. Product Wedge & Leverage: Is the initial product/wedge friction-free enough to drive early adoption? Does it solve a high-value, painful problem or is it "nice-to-have"?
2. Defensibility & Moat: What prevents this product from being copied? Is there network effects, high switching costs, proprietary technology, or data flywheels? Or is it a thin wrapper over existing APIs/platforms that incumbents can easily replicate?
3. Distribution & GTM: Is the go-to-market strategy clear? What is the acquisition channel advantage? Can they scale customer acquisition efficiently?
4. Pivot Flexibility: Does the underlying technology, architecture, or core thesis allow the team to successfully pivot within this space if their initial GTM strategy or product wedge is rejected by the market?

First, argue the strongest case that this idea, as pitched, fails against this market. Let that adversarial stress-test inform your final score. A great market and a great founder do not guarantee a good product-market wedge.

Respond ONLY with a JSON object:
{
  "score": <0-100 number representing idea-vs-market fit>,
  "rating": <one of "strong_fit", "plausible_fit", "weak_fit", "poor_fit">,
  "trend": <one of "improving", "stable", "declining">,
  "rationale": <2-3 sentences summarizing the strongest product risk/bear case and the viability of a pivot>
}"""


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
