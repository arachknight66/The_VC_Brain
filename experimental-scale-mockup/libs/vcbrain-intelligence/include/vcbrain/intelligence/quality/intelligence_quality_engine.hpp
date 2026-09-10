#ifndef VCBRAIN_INTELLIGENCE_QUALITY_INTELLIGENCE_QUALITY_ENGINE_HPP
#define VCBRAIN_INTELLIGENCE_QUALITY_INTELLIGENCE_QUALITY_ENGINE_HPP

#include <string>
#include <vector>
#include <unordered_map>
#include <mutex>
#include <nlohmann/json.hpp>

namespace vcbrain::intelligence::quality {

struct QualityBreakdown {
    double ai_grounding_score{100.0};      // Weight: 0.25
    double evidence_coverage_score{99.8};   // Weight: 0.20
    double search_ndcg_score{96.5};         // Weight: 0.15
    double kg_consistency_score{99.5};      // Weight: 0.15
    double data_freshness_score{96.0};      // Weight: 0.15
    double provider_trust_score{98.0};      // Weight: 0.10
    double composite_iqs{97.8};             // Master Composite Score [0, 100]
};

struct ProviderTrustMetrics {
    std::string provider_id;
    std::string provider_name;
    double availability_pct{99.9};
    double latency_p95_ms{14.2};
    double precision_score{0.96};
    double recall_score{0.94};
    double trust_score{98.0};
};

class MasterIQSCalculator {
public:
    [[nodiscard]] static double compute_composite_iqs(const QualityBreakdown& breakdown);
    [[nodiscard]] static QualityBreakdown evaluate_current_platform_quality();
};

class QualityDriftDetector {
public:
    static QualityDriftDetector& instance();

    [[nodiscard]] bool check_quality_drift(const QualityBreakdown& current_quality);
    [[nodiscard]] double iqs_threshold() const noexcept { return iqs_threshold_; }

private:
    QualityDriftDetector() = default;
    double iqs_threshold_{95.0}; // IQS Quality Gate Ceiling: 95.0 / 100.0
};

class ProviderTrustEngine {
public:
    static ProviderTrustEngine& instance();

    void record_provider_metrics(const ProviderTrustMetrics& metrics);
    [[nodiscard]] ProviderTrustMetrics get_provider_trust(const std::string& provider_id) const;
    [[nodiscard]] std::vector<ProviderTrustMetrics> list_provider_rankings() const;

private:
    ProviderTrustEngine() = default;
    mutable std::mutex mutex_;
    std::unordered_map<std::string, ProviderTrustMetrics> provider_metrics_;
};

class ExecutiveQualityDashboard {
public:
    [[nodiscard]] static nlohmann::json generate_executive_kpi_report();
};

} // namespace vcbrain::intelligence::quality

#endif // VCBRAIN_INTELLIGENCE_QUALITY_INTELLIGENCE_QUALITY_ENGINE_HPP
