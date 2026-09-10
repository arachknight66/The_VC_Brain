#include <gtest/gtest.h>
#include "vcbrain/observability/analyst_workflow_analytics.hpp"

using namespace vcbrain::observability;

TEST(AnalystWorkflowValidationTest, WorkflowAnalyticsEngineTracksKpisAndHoursSaved) {
    WorkflowAnalyticsEngine& engine = WorkflowAnalyticsEngine::instance();

    engine.record_event(AnalystWorkflowEvent{
        .event_id = "evt_test_002",
        .analyst_id = "user_arjun_kapoor",
        .tenant_id = "tenant_sequoia_demo",
        .role = AnalystRole::ASSOCIATE,
        .workflow_type = "DISCOVERY",
        .time_saved_seconds = 18000.0, // 5 hours saved
        .citations_viewed = 8,
        .nps_score = 9,
        .timestamp = "2026-08-07T11:00:00Z"
    });

    auto kpi = engine.get_kpi_summary();
    EXPECT_GE(kpi.total_workflows_executed, 2u);
    EXPECT_GE(kpi.total_research_hours_saved, 12.0);
    EXPECT_DOUBLE_EQ(kpi.avg_hours_saved_per_deal, 7.5);
    EXPECT_DOUBLE_EQ(kpi.avg_memo_gen_time_minutes, 45.0);
    EXPECT_EQ(kpi.net_promoter_score, 74);
    EXPECT_DOUBLE_EQ(kpi.customer_satisfaction_pct, 96.2);
}

TEST(AnalystWorkflowValidationTest, ExecutiveWorkflowDashboardGeneratesRoleSpecificKpis) {
    auto mp_dash = ExecutiveWorkflowDashboard::generate_persona_dashboard(AnalystRole::MANAGING_PARTNER);
    EXPECT_EQ(mp_dash["role"], "Managing Partner");
    EXPECT_DOUBLE_EQ(mp_dash["primary_kpis"]["firm_roi_multiplier"].get<double>(), 4.2);

    auto analyst_dash = ExecutiveWorkflowDashboard::generate_persona_dashboard(AnalystRole::INVESTMENT_ANALYST);
    EXPECT_EQ(analyst_dash["primary_kpis"]["memo_gen_speedup"], "11.3x");
}
