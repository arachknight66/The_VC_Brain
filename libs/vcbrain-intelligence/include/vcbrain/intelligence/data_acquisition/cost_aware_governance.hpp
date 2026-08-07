#ifndef VCBRAIN_INTELLIGENCE_DATA_ACQUISITION_COST_AWARE_GOVERNANCE_HPP
#define VCBRAIN_INTEGRATION_DATA_ACQUISITION_COST_AWARE_GOVERNANCE_HPP

#include <string>
#include <unordered_map>
#include <mutex>
#include <atomic>
#include <nlohmann/json.hpp>

namespace vcbrain::intelligence::acquisition {

class ProviderFeatureFlags {
public:
    static ProviderFeatureFlags& instance();

    [[nodiscard]] bool is_provider_enabled(const std::string& provider_id) const;
    void set_provider_enabled(const std::string& provider_id, bool enabled);

private:
    ProviderFeatureFlags();
    mutable std::mutex mutex_;
    std::unordered_map<std::string, bool> flags_;
};

class DailyBudgetManager {
public:
    static DailyBudgetManager& instance();

    void set_daily_budget_limit_usd(double limit_usd) { budget_limit_usd_ = limit_usd; }
    [[nodiscard]] bool can_allocate_spend(double cost_usd) const;
    void record_spend(double cost_usd);
    [[nodiscard]] double current_daily_spend_usd() const noexcept { return daily_spend_usd_.load(); }
    [[nodiscard]] double budget_limit_usd() const noexcept { return budget_limit_usd_; }

private:
    DailyBudgetManager() = default;
    double budget_limit_usd_{5.00}; // $5.00 daily budget ceiling
    std::atomic<double> daily_spend_usd_{0.0};
};

class AcquisitionRequestCache {
public:
    static AcquisitionRequestCache& instance();

    [[nodiscard]] bool has_cached_response(const std::string& query, const std::string& provider_id) const;
    [[nodiscard]] nlohmann::json get_cached_response(const std::string& query, const std::string& provider_id) const;
    void store_response(const std::string& query, const std::string& provider_id, const nlohmann::json& response);

private:
    AcquisitionRequestCache() = default;
    [[nodiscard]] std::string compute_cache_key(const std::string& query, const std::string& provider_id) const;

    mutable std::mutex mutex_;
    std::unordered_map<std::string, nlohmann::json> cache_;
};

} // namespace vcbrain::intelligence::acquisition

#endif // VCBRAIN_INTELLIGENCE_DATA_ACQUISITION_COST_AWARE_GOVERNANCE_HPP
