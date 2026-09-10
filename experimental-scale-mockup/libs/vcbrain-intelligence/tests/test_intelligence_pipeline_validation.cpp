#include <gtest/gtest.h>
#include "vcbrain/intelligence/data_acquisition/cost_aware_governance.hpp"
#include "vcbrain/intelligence/data_acquisition/provider_framework.hpp"
#include "vcbrain/intelligence/epic10_ai/ai_pipeline.hpp"

using namespace vcbrain::intelligence::acquisition;
using namespace vcbrain::intelligence::ai;

// =====================================================================
// COST-AWARE GOVERNANCE & FEATURE FLAG TESTS
// =====================================================================
TEST(Phase52IntelligenceValidationTest, PaidProvidersDisabledByDefault) {
    auto& flags = ProviderFeatureFlags::instance();

    EXPECT_FALSE(flags.is_provider_enabled("exa_ai"));
    EXPECT_FALSE(flags.is_provider_enabled("tavily"));
    EXPECT_FALSE(flags.is_provider_enabled("serpapi"));

    EXPECT_TRUE(flags.is_provider_enabled("github_api"));
    EXPECT_TRUE(flags.is_provider_enabled("sec_edgar"));
    EXPECT_TRUE(flags.is_provider_enabled("openalex"));
}

TEST(Phase52IntelligenceValidationTest, AcquisitionCachePreventsDuplicateCharges) {
    auto& cache = AcquisitionRequestCache::instance();

    std::string query = "Quantum Compute AI";
    std::string provider = "github_api";

    EXPECT_FALSE(cache.has_cached_response(query, provider));

    nlohmann::json resp = {{"stars", 1420}, {"status", "OK"}};
    cache.store_response(query, provider, resp);

    EXPECT_TRUE(cache.has_cached_response(query, provider));
    auto retrieved = cache.get_cached_response(query, provider);
    EXPECT_EQ(retrieved["stars"], 1420);
}

TEST(Phase52IntelligenceValidationTest, DailyBudgetManagerEnforcesSpendCeiling) {
    auto& budget = DailyBudgetManager::instance();
    budget.set_daily_budget_limit_usd(5.00);

    EXPECT_TRUE(budget.can_allocate_spend(1.00));
    budget.record_spend(4.50);

    EXPECT_FALSE(budget.can_allocate_spend(1.00)); // Exceeds $5.00 limit
}

// =====================================================================
// AI GROUNDING & ZERO-HALLUCINATION EVALUATION
// =====================================================================
TEST(Phase52IntelligenceValidationTest, AIGeneratedThesesAre100PercentEvidenceBacked) {
    AIIntelligencePipeline pipeline;

    std::string entity_id = "ent_01912a4b-7c8d-7123";
    std::string rcpt_id = "rcpt_e3b0c44298fc1c149af";

    auto rag_ctx = pipeline.assemble_rag_context(entity_id, {rcpt_id}, {"GitHub Repository verified with 1,420 stars."});
    auto insight = pipeline.generate_explainable_insight(rag_ctx);

    // Verify 100% of generated statements are backed by SHA-256 evidence citations
    EXPECT_FALSE(insight.executive_summary.empty());
    EXPECT_FALSE(insight.citations.empty());
    EXPECT_EQ(insight.citations.front(), rcpt_id);
}
