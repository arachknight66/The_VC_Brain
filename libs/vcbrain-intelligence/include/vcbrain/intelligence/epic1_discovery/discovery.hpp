#ifndef VCBRAIN_INTELLIGENCE_DISCOVERY_HPP
#define VCBRAIN_INTELLIGENCE_DISCOVERY_HPP

#include "vcbrain/core/id_generator.hpp"
#include <string>
#include <vector>
#include <memory>
#include <chrono>
#include <nlohmann/json.hpp>

namespace vcbrain::intelligence::discovery {

enum class ProviderType {
    EXA,
    TAVILY,
    SERPAPI,
    GITHUB,
    OPENALEX,
    SEC_EDGAR
};

struct DiscoverySignal {
    std::string signal_id;
    ProviderType provider;
    std::string query;
    std::string raw_content;
    std::string source_url;
    double relevance_score{0.0};
    double estimated_cost_usd{0.001};
    std::chrono::system_clock::time_point discovered_at;
};

class ProviderAdapter {
public:
    virtual ~ProviderAdapter() = default;
    [[nodiscard]] virtual ProviderType type() const noexcept = 0;
    [[nodiscard]] virtual std::vector<DiscoverySignal> search(const std::string& query) = 0;
};

class ExaAdapter : public ProviderAdapter {
public:
    ProviderType type() const noexcept override { return ProviderType::EXA; }
    std::vector<DiscoverySignal> search(const std::string& query) override;
};

class GitHubAdapter : public ProviderAdapter {
public:
    ProviderType type() const noexcept override { return ProviderType::GITHUB; }
    std::vector<DiscoverySignal> search(const std::string& query) override;
};

class SECEdgarAdapter : public ProviderAdapter {
public:
    ProviderType type() const noexcept override { return ProviderType::SEC_EDGAR; }
    std::vector<DiscoverySignal> search(const std::string& query) override;
};

class DiscoveryCoordinator {
public:
    DiscoveryCoordinator();
    void register_adapter(std::shared_ptr<ProviderAdapter> adapter);
    [[nodiscard]] std::vector<DiscoverySignal> execute_sweep(const std::string& target_name);
    [[nodiscard]] double get_total_cost_usd() const noexcept { return total_cost_usd_; }

private:
    std::vector<std::shared_ptr<ProviderAdapter>> adapters_;
    double total_cost_usd_{0.0};
};

} // namespace vcbrain::intelligence::discovery

#endif // VCBRAIN_INTELLIGENCE_DISCOVERY_HPP
