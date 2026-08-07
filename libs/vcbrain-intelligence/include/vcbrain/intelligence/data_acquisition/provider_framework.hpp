#ifndef VCBRAIN_INTELLIGENCE_DATA_ACQUISITION_PROVIDER_FRAMEWORK_HPP
#define VCBRAIN_INTEGRATION_DATA_ACQUISITION_PROVIDER_FRAMEWORK_HPP

#include <string>
#include <vector>
#include <unordered_map>
#include <memory>
#include <atomic>
#include <chrono>
#include <nlohmann/json.hpp>

namespace vcbrain::intelligence::acquisition {

// Required Data Model (Phase 5.1 Mandate)
struct AcquiredRecord {
    std::string global_entity_id;
    std::string provider_id;
    std::string provider_name;
    std::string source_url;
    std::string canonical_url;
    nlohmann::json original_payload;
    nlohmann::json normalized_payload;
    std::string discovery_timestamp;
    std::string acquisition_timestamp;
    std::string verification_timestamp;
    std::string collector_version;
    std::string provider_version;
    std::string license_type;
    std::string evidence_id;
    double confidence_score;
    std::string content_hash_sha256;
    std::string trace_id;
    std::string correlation_id;
    std::string processing_status;
};

struct ProviderCapabilities {
    bool supports_neural_search{false};
    bool supports_web_crawl{false};
    bool supports_sec_filings{false};
    bool supports_academic_papers{false};
    bool supports_github_velocity{false};
    double cost_per_query_usd{0.0};
    uint32_t rate_limit_rps{10};
};

class IDataProvider {
public:
    virtual ~IDataProvider() = default;
    [[nodiscard]] virtual std::string provider_id() const = 0;
    [[nodiscard]] virtual std::string provider_name() const = 0;
    [[nodiscard]] virtual ProviderCapabilities capabilities() const = 0;
    [[nodiscard]] virtual bool authenticate() = 0;
    [[nodiscard]] virtual std::vector<AcquiredRecord> fetch_records(const std::string& query, uint32_t max_results) = 0;
};

class ProviderCostMonitor {
public:
    static ProviderCostMonitor& instance();
    void record_query(const std::string& provider_id, double cost_usd);
    [[nodiscard]] double total_cost_usd() const noexcept { return total_cost_usd_.load(); }
    [[nodiscard]] double provider_cost_usd(const std::string& provider_id) const;

private:
    ProviderCostMonitor() = default;
    std::atomic<double> total_cost_usd_{0.0};
    std::unordered_map<std::string, double> provider_costs_;
};

class ProviderRegistry {
public:
    static ProviderRegistry& instance();
    void register_provider(std::shared_ptr<IDataProvider> provider);
    [[nodiscard]] std::shared_ptr<IDataProvider> get_provider(const std::string& provider_id) const;
    [[nodiscard]] std::vector<std::shared_ptr<IDataProvider>> list_providers() const;
    [[nodiscard]] std::vector<AcquiredRecord> execute_multi_provider_acquisition(const std::string& query, uint32_t max_results);

private:
    ProviderRegistry() = default;
    std::unordered_map<std::string, std::shared_ptr<IDataProvider>> providers_;
};

} // namespace vcbrain::intelligence::acquisition

#endif // VCBRAIN_INTELLIGENCE_DATA_ACQUISITION_PROVIDER_FRAMEWORK_HPP
