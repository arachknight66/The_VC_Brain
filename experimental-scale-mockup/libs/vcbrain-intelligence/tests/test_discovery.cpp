#include <gtest/gtest.h>
#include "vcbrain/intelligence/epic1_discovery/discovery.hpp"

using namespace vcbrain::intelligence::discovery;

TEST(DiscoveryCoordinatorTest, ExecutesMultiProviderSweepAndTracksCosts) {
    DiscoveryCoordinator coordinator;
    auto signals = coordinator.execute_sweep("Anthropic");

    EXPECT_GE(signals.size(), 3u);
    EXPECT_GT(coordinator.get_total_cost_usd(), 0.0);
}
