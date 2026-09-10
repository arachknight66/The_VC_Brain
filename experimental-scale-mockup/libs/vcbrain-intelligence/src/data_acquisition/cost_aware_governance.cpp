#include "vcbrain/intelligence/data_acquisition/cost_aware_governance.hpp"
#include "vcbrain/intelligence/epic5_evidence/evidence.hpp"
#include <cstdlib>
#include <spdlog/spdlog.h>

namespace vcbrain::intelligence::acquisition {

ProviderFeatureFlags& ProviderFeatureFlags::instance() {
    static ProviderFeatureFlags instance;
    return instance;
}

ProviderFeatureFlags::ProviderFeatureFlags() {
    // Read environment switches (Paid providers disabled by default)
    auto get_env_bool = [](const char* name, bool default_val) {
        const char* val = std::getenv(name);
        if (!val) return default_val;
        std::string s(val);
        return s == "true" || s == "1";
    };

    flags_["exa_ai"] = get_env_bool("VCBRAIN_PROVIDER_EXA_ENABLED", false);
    flags_["tavily"] = get_env_bool("VCBRAIN_PROVIDER_TAVILY_ENABLED", false);
    flags_["serpapi"] = get_env_bool("VCBRAIN_PROVIDER_SERPAPI_ENABLED", false);
    flags_["firecrawl"] = get_env_bool("VCBRAIN_PROVIDER_FIRECRAWL_ENABLED", false);
    flags_["brightdata"] = get_env_bool("VCBRAIN_PROVIDER_BRIGHTDATA_ENABLED", false);

    // Free providers enabled by default
    flags_["github_api"] = get_env_bool("VCBRAIN_PROVIDER_GITHUB_ENABLED", true);
    flags_["sec_edgar"] = get_env_bool("VCBRAIN_PROVIDER_SEC_ENABLED", true);
    flags_["openalex"] = get_env_bool("VCBRAIN_PROVIDER_OPENALEX_ENABLED", true);

    spdlog::info("ProviderFeatureFlags initialized. Exa AI: {}, Tavily: {}, SerpAPI: {}, GitHub: {}, SEC: {}",
                 flags_["exa_ai"], flags_["tavily"], flags_["serpapi"], flags_["github_api"], flags_["sec_edgar"]);
}

bool ProviderFeatureFlags::is_provider_enabled(const std::string& provider_id) const {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = flags_.find(provider_id);
    return (it != flags_.end()) ? it->second : false;
}

void ProviderFeatureFlags::set_provider_enabled(const std::string& provider_id, bool enabled) {
    std::lock_guard<std::mutex> lock(mutex_);
    flags_[provider_id] = enabled;
    spdlog::info("Provider feature flag '{}' updated to {}", provider_id, enabled);
}

DailyBudgetManager& DailyBudgetManager::instance() {
    static DailyBudgetManager instance;
    return instance;
}

bool DailyBudgetManager::can_allocate_spend(double cost_usd) const {
    return (daily_spend_usd_.load() + cost_usd) <= budget_limit_usd_;
}

void DailyBudgetManager::record_spend(double cost_usd) {
    daily_spend_usd_ = daily_spend_usd_.load() + cost_usd;
    spdlog::info("DailyBudgetManager spend recorded: ${:.4f}. Total today: ${:.4f} / ${:.2f}",
                 cost_usd, daily_spend_usd_.load(), budget_limit_usd_);
}

AcquisitionRequestCache& AcquisitionRequestCache::instance() {
    static AcquisitionRequestCache instance;
    return instance;
}

std::string AcquisitionRequestCache::compute_cache_key(const std::string& query, const std::string& provider_id) const {
    return evidence::EvidenceRegistry::calculate_sha256(provider_id + "::" + query);
}

bool AcquisitionRequestCache::has_cached_response(const std::string& query, const std::string& provider_id) const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::string key = compute_cache_key(query, provider_id);
    return cache_.find(key) != cache_.end();
}

nlohmann::json AcquisitionRequestCache::get_cached_response(const std::string& query, const std::string& provider_id) const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::string key = compute_cache_key(query, provider_id);
    auto it = cache_.find(key);
    return (it != cache_.end()) ? it->second : nlohmann::json::object();
}

void AcquisitionRequestCache::store_response(const std::string& query, const std::string& provider_id, const nlohmann::json& response) {
    std::lock_guard<std::mutex> lock(mutex_);
    std::string key = compute_cache_key(query, provider_id);
    cache_[key] = response;
    spdlog::info("AcquisitionRequestCache stored response for key '{}' (Query: '{}')", key.substr(0, 12), query);
}

} // namespace vcbrain::intelligence::acquisition
