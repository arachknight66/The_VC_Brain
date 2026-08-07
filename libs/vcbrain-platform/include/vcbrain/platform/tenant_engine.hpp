#ifndef VCBRAIN_PLATFORM_TENANT_ENGINE_HPP
#define VCBRAIN_PLATFORM_TENANT_ENGINE_HPP

#include <string>
#include <vector>
#include <unordered_map>
#include <mutex>
#include <nlohmann/json.hpp>

namespace vcbrain::platform {

enum class TenantTier {
    SMALL_VC,           // 2-5 partners
    MID_VC,             // 15-50 analysts
    CORPORATE_VC,       // Enterprise CVC
    ACCELERATOR         // Accelerator / Incubator
};

struct TenantConfig {
    std::string tenant_id;
    std::string organization_name;
    TenantTier tier{TenantTier::MID_VC};
    std::string sso_provider; // "SAML_OKTA", "OIDC_GOOGLE", "AZURE_AD"
    std::string saml_entrypoint;
    std::vector<std::string> ip_allowlist;
    double monthly_budget_usd{250.0};
    uint32_t max_tracked_entities{100000};
    bool is_active{true};
    std::string created_at;
};

class TenantContext {
public:
    TenantContext(std::string tenant_id, std::string org_name, TenantTier tier)
        : tenant_id_(std::move(tenant_id)), org_name_(std::move(org_name)), tier_(tier) {}

    [[nodiscard]] const std::string& tenant_id() const noexcept { return tenant_id_; }
    [[nodiscard]] const std::string& org_name() const noexcept { return org_name_; }
    [[nodiscard]] TenantTier tier() const noexcept { return tier_; }
    [[nodiscard]] std::string get_search_index_name() const { return "vcbrain_" + tenant_id_ + "_docs"; }

    static void set_current(TenantContext ctx);
    [[nodiscard]] static const TenantContext& current();

private:
    std::string tenant_id_;
    std::string org_name_;
    TenantTier tier_;
};

class TenantRegistry {
public:
    static TenantRegistry& instance();

    bool register_tenant(const TenantConfig& config);
    [[nodiscard]] bool has_tenant(const std::string& tenant_id) const;
    [[nodiscard]] TenantConfig get_tenant(const std::string& tenant_id) const;
    [[nodiscard]] std::vector<TenantConfig> list_tenants() const;

private:
    TenantRegistry() = default;
    mutable std::mutex mutex_;
    std::unordered_map<std::string, TenantConfig> tenants_;
};

class EnterpriseOnboardingWizard {
public:
    [[nodiscard]] static TenantConfig provision_new_tenant(
        const std::string& org_name,
        TenantTier tier,
        const std::string& admin_email,
        const std::string& sso_provider = "OIDC_GOOGLE"
    );
};

} // namespace vcbrain::platform

#endif // VCBRAIN_PLATFORM_TENANT_ENGINE_HPP
