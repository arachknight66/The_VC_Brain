#include "vcbrain/platform/tenant_engine.hpp"
#include "vcbrain/core/id_generator.hpp"
#include "vcbrain/core/time_utils.hpp"
#include <spdlog/spdlog.h>

namespace vcbrain::platform {

static thread_local TenantContext current_tenant_ctx("tenant_default", "Default VC Firm", TenantTier::MID_VC);

void TenantContext::set_current(TenantContext ctx) {
    current_tenant_ctx = std::move(ctx);
}

const TenantContext& TenantContext::current() {
    return current_tenant_ctx;
}

TenantRegistry& TenantRegistry::instance() {
    static TenantRegistry instance;
    static std::once_flag flag;
    std::call_once(flag, []() {
        instance.register_tenant(TenantConfig{
            .tenant_id = "tenant_sequoia_demo",
            .organization_name = "Sequoia Capital Demo Workspace",
            .tier = TenantTier::CORPORATE_VC,
            .sso_provider = "OIDC_GOOGLE",
            .monthly_budget_usd = 1000.0,
            .max_tracked_entities = 500000,
            .is_active = true,
            .created_at = core::TimeUtils::current_iso8601()
        });
    });
    return instance;
}

bool TenantRegistry::register_tenant(const TenantConfig& config) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (tenants_.find(config.tenant_id) != tenants_.end()) {
        spdlog::warn("TenantRegistry: Tenant ID '{}' already exists.", config.tenant_id);
        return false;
    }
    tenants_[config.tenant_id] = config;
    spdlog::info("Provisioned new Tenant: '{}' ({}) Tier: {}",
                 config.organization_name, config.tenant_id, static_cast<int>(config.tier));
    return true;
}

bool TenantRegistry::has_tenant(const std::string& tenant_id) const {
    std::lock_guard<std::mutex> lock(mutex_);
    return tenants_.find(tenant_id) != tenants_.end();
}

TenantConfig TenantRegistry::get_tenant(const std::string& tenant_id) const {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = tenants_.find(tenant_id);
    return (it != tenants_.end()) ? it->second : TenantConfig{.tenant_id = tenant_id};
}

std::vector<TenantConfig> TenantRegistry::list_tenants() const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<TenantConfig> list;
    for (const auto& [id, t] : tenants_) {
        list.push_back(t);
    }
    return list;
}

TenantConfig EnterpriseOnboardingWizard::provision_new_tenant(
    const std::string& org_name,
    TenantTier tier,
    const std::string& admin_email,
    const std::string& sso_provider
) {
    std::string tid = "tnt_" + core::IDGenerator::new_uuidv7_string().substr(0, 8);
    double budget = 250.0;
    uint32_t entities = 100000;

    switch (tier) {
        case TenantTier::SMALL_VC: budget = 50.0; entities = 10000; break;
        case TenantTier::MID_VC: budget = 250.0; entities = 100000; break;
        case TenantTier::CORPORATE_VC: budget = 1000.0; entities = 500000; break;
        case TenantTier::ACCELERATOR: budget = 500.0; entities = 250000; break;
    }

    TenantConfig config{
        .tenant_id = tid,
        .organization_name = org_name,
        .tier = tier,
        .sso_provider = sso_provider,
        .saml_entrypoint = "https://sso." + org_name + ".com/saml",
        .monthly_budget_usd = budget,
        .max_tracked_entities = entities,
        .is_active = true,
        .created_at = core::TimeUtils::current_iso8601()
    };

    TenantRegistry::instance().register_tenant(config);
    spdlog::info("Enterprise Onboarding complete for '{}' (Admin: {})", org_name, admin_email);
    return config;
}

} // namespace vcbrain::platform
