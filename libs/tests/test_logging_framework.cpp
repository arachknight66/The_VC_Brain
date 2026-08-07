#include <gtest/gtest.h>
#include "vcbrain/observability/logging_framework.hpp"
#include "vcbrain/observability/metrics_framework.hpp"
#include "vcbrain/observability/health_framework.hpp"

using namespace vcbrain::observability;

TEST(LoggingEngineTest, InitializesWithoutException) {
    EXPECT_NO_THROW(LoggingEngine::initialize("test_service"));
}

TEST(MetricsRegistryTest, IncrementsAndRetrievesCounters) {
    MetricsRegistry& registry = MetricsRegistry::instance();
    registry.increment_counter("requests_total", 5);
    registry.increment_counter("requests_total", 3);

    EXPECT_EQ(registry.get_counter("requests_total"), 8u);
}

TEST(HealthCheckerTest, EvaluatesSubsystemHealth) {
    HealthChecker& checker = HealthChecker::instance();
    checker.register_subsystem("cockroachdb", []() { return SubsystemStatus::UP; });
    checker.register_subsystem("redis", []() { return SubsystemStatus::DEGRADED; });

    nlohmann::json health = checker.evaluate_health();
    EXPECT_EQ(health["status"], "DEGRADED");
    EXPECT_EQ(health["subsystems"]["cockroachdb"], "UP");
    EXPECT_EQ(health["subsystems"]["redis"], "DEGRADED");
}
