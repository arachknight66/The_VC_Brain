#include <gtest/gtest.h>
#include "vcbrain/platform/gold_master_audit_engine.hpp"

using namespace vcbrain::platform;

TEST(GoldMasterAuditTest, CertifierValidatesAllTwelveAuditEpics) {
    GoldMasterCertifier& certifier = GoldMasterCertifier::instance();

    EXPECT_TRUE(certifier.verify_gold_master_readiness());

    auto epics = certifier.get_audit_epic_results();
    EXPECT_EQ(epics.size(), 12u);

    for (const auto& e : epics) {
        EXPECT_EQ(e.status, "PASSED");
        EXPECT_EQ(e.violations_found, 0u);
    }
}

TEST(GoldMasterAuditTest, ScorecardAchievesGradeAOverallHealth) {
    auto scorecard = GoldMasterCertifier::instance().get_scorecard();

    EXPECT_GE(scorecard.overall_health_score, 99.0);
    EXPECT_DOUBLE_EQ(scorecard.architecture_compliance_pct, 100.0);
    EXPECT_DOUBLE_EQ(scorecard.security_audit_pct, 100.0);
    EXPECT_DOUBLE_EQ(scorecard.documentation_coverage_pct, 100.0);
    EXPECT_DOUBLE_EQ(scorecard.test_pass_rate_pct, 100.0);
    EXPECT_EQ(scorecard.dead_code_findings, 0u);
    EXPECT_EQ(scorecard.hardcoded_secret_findings, 0u);
    EXPECT_EQ(scorecard.unresolved_todos, 0u);
}

TEST(GoldMasterAuditTest, ExecutiveAuditReportGeneratesCleanJson) {
    auto report = GoldMasterCertifier::instance().generate_executive_audit_report();

    EXPECT_EQ(report["release_version"], "v2.0.0-GM");
    EXPECT_TRUE(report["gold_master_certified"]);
    EXPECT_GE(report["overall_health_score"].get<double>(), 99.0);
}
