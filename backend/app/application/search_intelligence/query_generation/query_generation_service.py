import hashlib

from app.domain.search_intelligence.query.generated_query import GeneratedQuery
from app.domain.search_intelligence.query.search_category import SearchCategory
from app.domain.search_intelligence.query.search_intent import SearchIntent


class QueryGenerationService:
    def generate(self, intent: SearchIntent) -> list[GeneratedQuery]:
        seed_terms = [intent.company, intent.founder, intent.technology, intent.market, intent.industry]
        subject = next((term for term in seed_terms if term), intent.investment_thesis or "startup")
        templates = [
            ("{subject} funding news", SearchCategory.FUNDING_NEWS, 10),
            ("{subject} enterprise customers", SearchCategory.CUSTOMER_SIGNALS, 9),
            ("{subject} recent partnerships", SearchCategory.STARTUP_NEWS, 8),
            ("{subject} competitors", SearchCategory.COMPETITOR, 8),
            ("{subject} Product Hunt", SearchCategory.PRODUCT_HUNT_INTELLIGENCE, 7),
            ("{subject} Hacker News", SearchCategory.HACKER_NEWS_INTELLIGENCE, 7),
            ("{subject} GitHub repositories", SearchCategory.GITHUB_INTELLIGENCE, 7),
            ("{subject} market size", SearchCategory.MARKET_RESEARCH, 6),
        ]
        queries = []
        for template, category, priority in templates[: intent.max_queries]:
            query_text = template.format(subject=subject)
            key = hashlib.sha256(f"{category}:{query_text}".encode()).hexdigest()
            queries.append(
                GeneratedQuery(
                    query_text=query_text,
                    category=category,
                    priority=priority,
                    rationale=f"Generated from search intent for {category.value}.",
                    deterministic_key=key,
                )
            )
        return queries

