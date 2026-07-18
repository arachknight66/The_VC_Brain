from app.domain.search_intelligence.query.search_intent import SearchIntent


class SearchValidationService:
    def validate_intent(self, intent: SearchIntent) -> None:
        if not any([intent.company, intent.founder, intent.technology, intent.market, intent.industry, intent.investment_thesis]):
            raise ValueError("At least one search intent field is required.")

