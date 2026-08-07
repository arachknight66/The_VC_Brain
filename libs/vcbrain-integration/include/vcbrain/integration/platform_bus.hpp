#ifndef VCBRAIN_INTEGRATION_PLATFORM_BUS_HPP
#define VCBRAIN_INTEGRATION_PLATFORM_BUS_HPP

#include "vcbrain/core/request_context.hpp"
#include "vcbrain/core/error_framework.hpp"
#include "vcbrain/platform/circuit_breaker.hpp"
#include "vcbrain/observability/logging_framework.hpp"
#include "vcbrain/observability/metrics_framework.hpp"
#include "vcbrain/observability/health_framework.hpp"
#include "vcbrain/security/spiffe_spire.hpp"

#include "vcbrain/intelligence/epic1_discovery/discovery.hpp"
#include "vcbrain/intelligence/epic2_crawl/crawl.hpp"
#include "vcbrain/intelligence/epic3_normalization/normalization.hpp"
#include "vcbrain/intelligence/epic5_evidence/evidence.hpp"
#include "vcbrain/intelligence/epic6_graph/graph_sync.hpp"
#include "vcbrain/intelligence/epic7_search/search_indexer.hpp"
#include "vcbrain/intelligence/epic8_vector/vector_retriever.hpp"
#include "vcbrain/intelligence/epic9_scoring/intelligence_scores.hpp"
#include "vcbrain/intelligence/epic10_ai/ai_pipeline.hpp"

#include "vcbrain/entityresolution/domain/service/blocking_service.hpp"
#include "vcbrain/entityresolution/domain/service/survivorship_service.hpp"
#include "vcbrain/entityresolution/application/service/entity_resolution_application_service.hpp"

#include <memory>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>

namespace vcbrain::integration {

struct EndToEndWorkflowRequest {
    std::string query;
    std::string user_token;
    std::string spiffe_id;
};

struct EndToEndWorkflowResponse {
    std::string request_id;
    std::string trace_id;
    std::string canonical_company_name;
    std::string primary_domain;
    std::string entity_id;
    std::string evidence_receipt_id;
    double match_confidence;
    double composite_investment_score;
    std::string executive_summary;
    std::string reasoning_chain;
    std::vector<std::string> citations;
    uint64_t total_execution_time_ms;
};

class PlatformBus {
public:
    static PlatformBus& instance();

    void initialize();
    [[nodiscard]] EndToEndWorkflowResponse execute_e2e_intelligence_workflow(const EndToEndWorkflowRequest& request);
    [[nodiscard]] nlohmann::json get_platform_health_status() const;

private:
    PlatformBus() = default;

    bool initialized_{false};
    std::shared_ptr<intelligence::discovery::DiscoveryCoordinator> discovery_coordinator_;
    std::shared_ptr<intelligence::crawl::CrawlOrchestrator> crawl_orchestrator_;
    std::shared_ptr<intelligence::evidence::EvidenceRegistry> evidence_registry_;
    std::shared_ptr<intelligence::graph::Neo4jGraphSynchronizer> graph_synchronizer_;
    std::shared_ptr<intelligence::search::ElasticsearchHybridSearcher> search_indexer_;
    std::shared_ptr<intelligence::vector::QdrantVectorRetriever> vector_retriever_;
    std::shared_ptr<intelligence::ai::AIIntelligencePipeline> ai_pipeline_;
    std::shared_ptr<entityresolution::domain::service::BlockingDomainService> blocking_service_;
    std::shared_ptr<entityresolution::domain::service::SurvivorshipDomainService> survivorship_service_;
    std::shared_ptr<platform::CircuitBreaker> circuit_breaker_;
};

} // namespace vcbrain::integration

#endif // VCBRAIN_INTEGRATION_PLATFORM_BUS_HPP
