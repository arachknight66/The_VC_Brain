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

SYSTEM_PROMPT = """You are a highly analytical, skeptical venture capital analyst assessing ONLY the attractiveness of the target market. Do not let a strong founder or a clever product angle inflate this score; judge only the market opportunity.

Evaluate the target market using the following rubric:
1. Market Scale & Growth Potential (TAM / SAM / SOM): What is the estimated Total Addressable Market and SAM? What is the growth rate (CAGR)? Is the market large enough to support a venture-scale (billion-dollar) exit?
2. Competitive Density: Assess the intensity of competition. Who are the dominant incumbents vs emerging players? Are there significant barriers to entry?
3. Macro Tailwinds & Timing: Why now? What technological catalysts, regulatory shifts, or behavioral trends are driving this market forward? Are there structural tailwinds or headwinds?

Structure your analysis objectively. Use the retrieved search results as ground truth for sizing and competitors. If no comparable data is retrieved, state so explicitly and rely on cautious general knowledge rather than fabricating specifics.

Respond ONLY with a JSON object:
{
  "score": <0-100 number representing market attractiveness>,
  "rating": <one of "bullish", "neutral", "bear">,
  "trend": <one of "improving", "stable", "declining">,
  "rationale": <2-3 sentences summarizing the size, competitors, and tailwinds/headwinds, referencing specific search results where possible>
}"""


@agent_stage("market_axis_scoring")
def run(record: FounderRecord) -> FounderRecord:
    sector = record.raw_inputs.get("sector") or record.company_name
    
    # Run two distinct Tavily queries for market sizing and competitive landscape
    results_size = search(f"{sector} market size growth CAGR projections 2025", max_results=3)
    results_competitors = search(f"{sector} competitors market landscape key players", max_results=3)
    
    # Merge retrieved search results by unique URL to prevent duplication
    seen_urls = set()
    merged_results = []
    for r in results_size + results_competitors:
        url = r.get("url")
        if url:
            url_clean = url.strip().rstrip("/")
            if url_clean not in seen_urls:
                seen_urls.add(url_clean)
                merged_results.append(r)
        else:
            merged_results.append(r)

    if merged_results:
        comparables_text = "\n".join(
            f"- {r.get('title', 'untitled')}: {(r.get('content') or '')[:250]}" for r in merged_results
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
