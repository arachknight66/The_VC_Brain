#include <gtest/gtest.h>
#include "vcbrain/intelligence/quality/intelligence_quality_engine.hpp"

using namespace vcbrain::intelligence::quality;

TEST(IntelligenceQualityCertificationTest, MasterIQSComputesAccurateWeightedComposite) {
    QualityBreakdown b{
        .ai_grounding_score = 100.0,    // 0.25 * 100 = 25.0
        .evidence_coverage_score = 100.0, // 0.20 * 100 = 20.0
        .search_ndcg_score = 100.0,       // 0.15 * 100 = 15.0
        .kg_consistency_score = 100.0,    // 0.15 * 100 = 15.0
        .data_freshness_score = 100.0,    // 0.15 * 100 = 15.0
        .provider_trust_score = 100.0     // 0.10 * 100 = 10.0
    };

    double iqs = MasterIQSCalculator::compute_composite_iqs(b);
    EXPECT_DOUBLE_EQ(iqs, 100.0);
}

TEST(IntelligenceQualityCertificationTest, QualityDriftDetectorTriggersOnLowIQS) {
    auto& detector = QualityDriftDetector::instance();

    QualityBreakdown good_q = MasterIQSCalculator::evaluate_current_platform_quality();
    EXPECT_FALSE(detector.check_quality_drift(good_q));

    QualityBreakdown degraded_q{
        .ai_grounding_score = 80.0,
        .evidence_coverage_score = 70.0,
        .search_ndcg_score = 70.0,
        .kg_consistency_score = 70.0,
        .data_freshness_score = 70.0,
        .provider_trust_score = 70.0
    };
    degraded_q.composite_iqs = MasterIQSCalculator::compute_composite_iqs(degraded_q);

    EXPECT_TRUE(detector.check_quality_drift(degraded_q));
}

TEST(IntelligenceQualityCertificationTest, ExecutiveQualityDashboardGeneratesCompleteReport) {
    auto dashboard = ExecutiveQualityDashboard::generate_executive_kpi_report();

    EXPECT_TRUE(dashboard["quality_gate_passed"]);
    EXPECT_EQ(dashboard["status"], "EXCELLENT");
    EXPECT_GE(dashboard["composite_iqs"].get<double>(), 95.0);
    EXPECT_GE(dashboard["provider_rankings"].size(), 3u);
}
