#include "vcbrain/intelligence/epic1_discovery/discovery.hpp"
#include <spdlog/spdlog.h>

namespace vcbrain::intelligence::discovery {

std::vector<DiscoverySignal> ExaAdapter::search(const std::string& query) {
    spdlog::info("Executing Exa Neural Search for query: '{}'", query);
    return {
        DiscoverySignal{
            .signal_id = core::IDGenerator::new_uuidv7_string(),
            .provider = ProviderType::EXA,
            .query = query,
            .raw_content = "Neural embedding result snippet for " + query,
            .source_url = "https://exa.ai/search?q=" + query,
            .relevance_score = 0.96,
            .estimated_cost_usd = 0.005,
            .discovered_at = std::chrono::system_clock::now()
        }
    };
}

std::vector<DiscoverySignal> GitHubAdapter::search(const std::string& query) {
    spdlog::info("Executing GitHub API Search for org/repo: '{}'", query);
    return {
        DiscoverySignal{
            .signal_id = core::IDGenerator::new_uuidv7_string(),
            .provider = ProviderType::GITHUB,
            .query = query,
            .raw_content = "GitHub organization repository metrics for " + query,
            .source_url = "https://github.com/" + query,
            .relevance_score = 0.92,
            .estimated_cost_usd = 0.001,
            .discovered_at = std::chrono::system_clock::now()
        }
    };
}

std::vector<DiscoverySignal> SECEdgarAdapter::search(const std::string& query) {
    spdlog::info("Executing SEC EDGAR Company Search for: '{}'", query);
    return {
        DiscoverySignal{
            .signal_id = core::IDGenerator::new_uuidv7_string(),
            .provider = ProviderType::SEC_EDGAR,
            .query = query,
            .raw_content = "Form C / Form D Reg D filing for " + query,
            .source_url = "https://www.sec.gov/edgar/searchedgar/companysearch",
            .relevance_score = 1.00,
            .estimated_cost_usd = 0.000,
            .discovered_at = std::chrono::system_clock::now()
        }
    };
}

DiscoveryCoordinator::DiscoveryCoordinator() {
    register_adapter(std::make_shared<ExaAdapter>());
    register_adapter(std::make_shared<GitHubAdapter>());
    register_adapter(std::make_shared<SECEdgarAdapter>());
}

void DiscoveryCoordinator::register_adapter(std::shared_ptr<ProviderAdapter> adapter) {
    adapters_.push_back(std::move(adapter));
}

std::vector<DiscoverySignal> DiscoveryCoordinator::execute_sweep(const std::string& target_name) {
    std::vector<DiscoverySignal> all_signals;
    for (const auto& adapter : adapters_) {
        auto signals = adapter->search(target_name);
        for (const auto& sig : signals) {
            total_cost_usd_ += sig.estimated_cost_usd;
            all_signals.push_back(sig);
        }
    }
    spdlog::info("DiscoveryCoordinator sweep finished for '{}'. Found {} signals. Total cost: ${:.4f}",
                 target_name, all_signals.size(), total_cost_usd_);
    return all_signals;
}

} // namespace vcbrain::intelligence::discovery
