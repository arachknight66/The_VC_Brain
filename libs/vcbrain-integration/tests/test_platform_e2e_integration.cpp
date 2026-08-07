#include <gtest/gtest.h>
#include "vcbrain/integration/platform_bus.hpp"

using namespace vcbrain::integration;

TEST(PlatformBusIntegrationTest, ExecutesEndToEndWorkflowAcrossAll10Epics) {
    PlatformBus& bus = PlatformBus::instance();
    bus.initialize();

    EndToEndWorkflowRequest req{
        .query = "Cognitive Cybersecurity AI",
        .user_token = "Bearer test_jwt_token",
        .spiffe_id = "spiffe://vcbrain.internal/ns/vcbrain-prod/sa/svc-entity-resolution-engine"
    };

    auto resp = bus.execute_e2e_intelligence_workflow(req);

    EXPECT_FALSE(resp.request_id.empty());
    EXPECT_FALSE(resp.trace_id.empty());
    EXPECT_EQ(resp.canonical_company_name, "Cognitive Cybersecurity AI");
    EXPECT_EQ(resp.primary_domain, "cognitivecybersecurityai.ai");
    EXPECT_FALSE(resp.entity_id.empty());
    EXPECT_FALSE(resp.evidence_receipt_id.empty());
    EXPECT_GE(resp.match_confidence, 0.90);
    EXPECT_GE(resp.composite_investment_score, 0.70);
    EXPECT_FALSE(resp.executive_summary.empty());
    EXPECT_GE(resp.citations.size(), 1u);
}

TEST(PlatformBusIntegrationTest, EvaluatesSubsystemHealthStatus) {
    PlatformBus& bus = PlatformBus::instance();
    bus.initialize();

    auto health = bus.get_platform_health_status();
    EXPECT_EQ(health["status"], "UP");
    EXPECT_EQ(health["subsystems"]["discovery_platform"], "UP");
    EXPECT_EQ(health["subsystems"]["evidence_registry"], "UP");
}
