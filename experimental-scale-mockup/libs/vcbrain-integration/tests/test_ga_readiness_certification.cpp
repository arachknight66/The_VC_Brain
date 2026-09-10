#include <gtest/gtest.h>
#include "vcbrain/platform/ga_readiness_engine.hpp"

using namespace vcbrain::platform;

TEST(GAReadinessCertificationTest, CertifierValidatesAllTenGACriteria) {
    GAReadinessCertifier& certifier = GAReadinessCertifier::instance();

    EXPECT_TRUE(certifier.validate_ga_criteria());

    auto summary = certifier.get_certification_summary();
    EXPECT_EQ(summary.version, "2.0.0-GA");
    EXPECT_TRUE(summary.ga_certified);
    EXPECT_GE(summary.iqs_score, 95.0);
    EXPECT_LT(summary.p95_latency_ms, 30.0);
    EXPECT_DOUBLE_EQ(summary.hallucination_rate_pct, 0.0);
    EXPECT_DOUBLE_EQ(summary.documentation_coverage_pct, 100.0);
}

TEST(GAReadinessCertificationTest, SupportDiagnosticEngineGeneratesValidBundle) {
    auto bundle = SupportDiagnosticEngine::export_support_diagnostic_bundle("tenant_sequoia_demo");

    EXPECT_EQ(bundle["tenant_id"], "tenant_sequoia_demo");
    EXPECT_EQ(bundle["system_status"], "HEALTHY");
    EXPECT_EQ(bundle["subsystem_health"]["cockroachdb_sql"], "UP");
    EXPECT_EQ(bundle["subsystem_health"]["spire_mTLS"], "VERIFIED");
}

TEST(GAReadinessCertificationTest, CommercialLicenseFrameworkValidatesEnterpriseEdition) {
    auto license = GAReadinessCertifier::instance().get_license("lic_ent_001");

    EXPECT_EQ(license.edition, CommercialEdition::ENTERPRISE_GA);
    EXPECT_TRUE(license.saml_sso_enabled);
    EXPECT_EQ(license.max_users, 1000u);
}
