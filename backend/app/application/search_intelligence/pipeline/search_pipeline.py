from app.application.search_intelligence.cache.search_cache_service import SearchCacheService
from app.application.search_intelligence.citation.citation_generation_service import CitationGenerationService
from app.application.search_intelligence.deduplication.search_deduplication_service import SearchDeduplicationService
from app.application.search_intelligence.evidence_extraction.search_evidence_extraction_service import SearchEvidenceExtractionService
from app.application.search_intelligence.metrics.search_metrics_service import SearchMetricsService
from app.application.search_intelligence.query_generation.query_generation_service import QueryGenerationService
from app.application.search_intelligence.ranking.search_ranking_service import SearchRankingService
from app.application.search_intelligence.validation.search_validation_service import SearchValidationService
from app.domain.search_intelligence.query.search_intent import SearchIntent
from app.domain.search_intelligence.result.search_result import SearchResult
from app.port.search.search_provider import SearchProvider


class SearchPipeline:
    def __init__(
        self,
        query_generation: QueryGenerationService,
        provider: SearchProvider,
        deduplication: SearchDeduplicationService,
        ranking: SearchRankingService,
        evidence_extraction: SearchEvidenceExtractionService,
        citation_generation: CitationGenerationService,
        cache: SearchCacheService,
        validation: SearchValidationService,
        metrics: SearchMetricsService,
    ) -> None:
        self.query_generation = query_generation
        self.provider = provider
        self.deduplication = deduplication
        self.ranking = ranking
        self.evidence_extraction = evidence_extraction
        self.citation_generation = citation_generation
        self.cache = cache
        self.validation = validation
        self.metrics = metrics

    async def run(self, intent: SearchIntent) -> list[SearchResult]:
        self.validation.validate_intent(intent)
        queries = self.query_generation.generate(intent)
        cached = await self.cache.get_many(queries)
        missing_queries = [query for query in queries if query.deterministic_key not in cached]
        fresh_results = []
        for query in missing_queries:
            fresh_results.extend(await self.provider.search(query))
        await self.cache.set_many(fresh_results)
        results = [*cached.values(), *fresh_results]
        results = self.deduplication.deduplicate(results)
        results = self.ranking.rank(results)
        results = self.evidence_extraction.prepare(results)
        results = self.citation_generation.attach_citations(results)
        self.metrics.record(intent=intent, query_count=len(queries), result_count=len(results))
        return results

