#include <gtest/gtest.h>
#include "vcbrain/intelligence/continuous/continuous_engine.hpp"

using namespace vcbrain::intelligence::continuous;

TEST(ContinuousIntelligenceTest, FreshnessPolicyManagerEvaluatesIntervalsCorrectly) {
    EXPECT_EQ(FreshnessPolicyManager::get_refresh_interval(EntityFreshnessTier::BREAKING_NEWS).count(), 15);
    EXPECT_EQ(FreshnessPolicyManager::get_refresh_interval(EntityFreshnessTier::WATCHED_ENTITY).count(), 1440);

    std::string stale_time = "2026-08-01T00:00:00Z";
    EXPECT_TRUE(FreshnessPolicyManager::is_stale(stale_time, EntityFreshnessTier::WATCHED_ENTITY));
}

TEST(ContinuousIntelligenceTest, AutonomousSchedulerTriggersFullCycleAndAlerts) {
    AutonomousScheduler& scheduler = AutonomousScheduler::instance();
    scheduler.start_autonomous_cycle();

    EXPECT_TRUE(scheduler.is_running());

    scheduler.trigger_manual_cycle("Autonomous Robotics Corp");

    EXPECT_GE(scheduler.cycles_completed(), 1u);

    auto alerts = AlertEngine::instance().get_recent_alerts();
    EXPECT_GE(alerts.size(), 1u);
    EXPECT_EQ(alerts.front().company_name, "Autonomous Robotics Corp");
    EXPECT_EQ(alerts.front().alert_type, "HIGH_CONVICTION_BREAKTHROUGH");

    scheduler.stop_autonomous_cycle();
    EXPECT_FALSE(scheduler.is_running());
}
