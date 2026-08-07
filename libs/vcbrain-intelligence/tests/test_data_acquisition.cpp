#include <gtest/gtest.h>
#include "vcbrain/intelligence/data_acquisition/provider_framework.hpp"

using namespace vcbrain::intelligence::acquisition;

TEST(DataAcquisitionTest, ProviderRegistryListsRegisteredProviders) {
    ProviderRegistry& registry = ProviderRegistry::instance();
    auto providers = registry.list_providers();

    EXPECT_GE(providers.size(), 3u); // Exa, GitHub, SEC EDGAR
}

TEST(DataAcquisitionTest, MultiProviderAcquisitionGeneratesCompliantRecords) {
    ProviderRegistry& registry = ProviderRegistry::instance();
    auto records = registry.execute_multi_provider_acquisition("Cognitive AI Labs", 5);

    EXPECT_GE(records.size(), 3u);

    for (const auto& rec : records) {
        EXPECT_FALSE(rec.global_entity_id.empty());
        EXPECT_FALSE(rec.provider_id.empty());
        EXPECT_FALSE(rec.source_url.empty());
        EXPECT_FALSE(rec.content_hash_sha256.empty());
        EXPECT_FALSE(rec.trace_id.empty());
        EXPECT_FALSE(rec.correlation_id.empty());
        EXPECT_GE(rec.confidence_score, 0.90);
    }
}

TEST(DataAcquisitionTest, CostMonitorAccuratelyTracksApiExpenses) {
    ProviderCostMonitor& monitor = ProviderCostMonitor::instance();
    double start_cost = monitor.total_cost_usd();

    monitor.record_query("exa_ai", 0.005);
    EXPECT_NEAR(monitor.total_cost_usd(), start_cost + 0.005, 0.0001);
}
