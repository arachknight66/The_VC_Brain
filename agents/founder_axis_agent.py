"""Independent axis 1/3: founder/team strength.

A standalone OpenAI call with its own prompt — deliberately not combined
with the market or idea-vs-market calls, so the three axes cannot share a
reasoning chain (build.md Section 5.5).
"""
from __future__ import annotations

from agents.base import agent_stage, axis_score_from_llm
from memory.models import FounderRecord
from utils.openai_client import chat_json

SYSTEM_PROMPT = """You are a highly analytical, skeptical venture capital analyst assessing ONLY the founder/team's strength as operators and builders. Do not let a good market or a clever product idea inflate this score.

Evaluate the founder and team using the following rubric:
1. Technical vs. Commercial Balance: Does the team possess the skills to both build the product and acquire customers? Are they builders or just coordinators?
2. Domain Expertise & Insights: Do the founders have deep domain knowledge, prior relevant work experience, or a unique insight into the problem space?
3. Execution Velocity: What is their historical speed of delivery? Cite evidence of rapid building (e.g. GitHub repos, hackathon wins), prior accelerator selection (like YC), or prior successful startup launches.
4. Coachability & Resilience: Is there evidence of adaptability, persistence, clear-eyed focus, and openness to feedback in their track record or presentation?

Be willing to give a low score to a weak or unproven founder even if the pitch is polished. Cite specific evidence from the input (such as GitHub activity, LinkedIn profile, or funding history).

Respond ONLY with a JSON object:
{
  "score": <0-100 number representing team strength>,
  "rating": <one of "exceptional", "strong", "solid", "weak", "red_flag">,
  "trend": <one of "improving", "stable", "declining">,
  "rationale": <2-3 sentences citing specific team execution evidence and track record signals>
}"""


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
