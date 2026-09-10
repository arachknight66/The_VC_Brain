#include <gtest/gtest.h>
#include "vcbrain/platform/tenant_engine.hpp"

using namespace vcbrain::platform;

TEST(EnterprisePilotDeploymentTest, MultiTenantRegistryProvisionsAndIsolatesTenants) {
    TenantRegistry& registry = TenantRegistry::instance();

    EXPECT_TRUE(registry.has_tenant("tenant_sequoia_demo"));

    auto t = registry.get_tenant("tenant_sequoia_demo");
    EXPECT_EQ(t.organization_name, "Sequoia Capital Demo Workspace");
    EXPECT_EQ(t.monthly_budget_usd, 1000.0);
}

TEST(EnterprisePilotDeploymentTest, OnboardingWizardProvisionsSmallVCAndCorporateVCTiers) {
    auto small_vc = EnterpriseOnboardingWizard::provision_new_tenant(
        "Benchmark Capital", TenantTier::SMALL_VC, "partner@benchmark.com"
    );

    EXPECT_FALSE(small_vc.tenant_id.empty());
    EXPECT_EQ(small_vc.monthly_budget_usd, 50.0);
    EXPECT_EQ(small_vc.max_tracked_entities, 10000u);

    auto corp_vc = EnterpriseOnboardingWizard::provision_new_tenant(
        "Intel Capital", TenantTier::CORPORATE_VC, "admin@intelcapital.com", "SAML_OKTA"
    );

    EXPECT_EQ(corp_vc.monthly_budget_usd, 1000.0);
    EXPECT_EQ(corp_vc.sso_provider, "SAML_OKTA");
}

TEST(EnterprisePilotDeploymentTest, RequestScopedTenantContextComputesSearchIndexNamespace) {
    TenantContext ctx("tnt_a1b2c3d4", "Accel Partners", TenantTier::MID_VC);
    TenantContext::set_current(ctx);

    const auto& curr = TenantContext::current();
    EXPECT_EQ(curr.tenant_id(), "tnt_a1b2c3d4");
    EXPECT_EQ(curr.get_search_index_name(), "vcbrain_tnt_a1b2c3d4_docs");
}
