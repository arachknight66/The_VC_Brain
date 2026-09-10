#include "vcbrain/intelligence/continuous/continuous_engine.hpp"
#include "vcbrain/core/id_generator.hpp"
#include "vcbrain/core/time_utils.hpp"
#include "vcbrain/integration/platform_bus.hpp"
#include <spdlog/spdlog.h>

namespace vcbrain::intelligence::continuous {

std::chrono::minutes FreshnessPolicyManager::get_refresh_interval(EntityFreshnessTier tier) {
    switch (tier) {
        case EntityFreshnessTier::BREAKING_NEWS: return std::chrono::minutes(15);
        case EntityFreshnessTier::HIGH_PRIORITY: return std::chrono::minutes(360);
        case EntityFreshnessTier::WATCHED_ENTITY: return std::chrono::minutes(1440); // 24 Hours
        case EntityFreshnessTier::GENERAL_ENTITY: return std::chrono::minutes(10080); // 7 Days
        case EntityFreshnessTier::DORMANT_ENTITY: return std::chrono::minutes(43200); // 30 Days
    }
    return std::chrono::minutes(1440);
}

bool FreshnessPolicyManager::is_stale(const std::string& last_updated_iso8601, EntityFreshnessTier tier) {
    uint64_t last_ms = core::TimeUtils::parse_iso8601_ms(last_updated_iso8601);
    uint64_t now_ms = core::TimeUtils::current_timestamp_ms();
    uint64_t diff_minutes = (now_ms - last_ms) / (1000 * 60);

    return diff_minutes >= static_cast<uint64_t>(get_refresh_interval(tier).count());
}

AlertEngine& AlertEngine::instance() {
    static AlertEngine instance;
    return instance;
}

void AlertEngine::dispatch_alert(const AlertNotification& alert) {
    std::lock_guard<std::mutex> lock(mutex_);
    alert_history_.push_back(alert);
    spdlog::info("[ALERT DISPATCH] Entity: {} | Type: {} | Summary: '{}'", alert.company_name, alert.alert_type, alert.summary);
}

std::vector<AlertNotification> AlertEngine::get_recent_alerts() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return alert_history_;
}

AutonomousScheduler& AutonomousScheduler::instance() {
    static AutonomousScheduler instance;
    return instance;
}

void AutonomousScheduler::start_autonomous_cycle() {
    if (running_) return;
    running_ = true;
    spdlog::info("Autonomous Continuous Intelligence Scheduler started successfully.");
}

void AutonomousScheduler::stop_autonomous_cycle() {
    if (!running_) return;
    running_ = false;
    spdlog::info("Autonomous Continuous Intelligence Scheduler stopped.");
}

void AutonomousScheduler::trigger_manual_cycle(const std::string& target_entity) {
    spdlog::info("Executing Autonomous Intelligence Cycle for target entity: '{}'", target_entity);

    // Execute E2E Workflow via PlatformBus
    integration::EndToEndWorkflowRequest req{
        .query = target_entity,
        .user_token = "Bearer autonomous_system_token",
        .spiffe_id = "spiffe://vcbrain.internal/ns/vcbrain-prod/sa/autonomous-scheduler"
    };

    auto resp = integration::PlatformBus::instance().execute_e2e_intelligence_workflow(req);

    // Generate Alert if composite score is high
    if (resp.composite_investment_score >= 0.85) {
        AlertEngine::instance().dispatch_alert(AlertNotification{
            .alert_id = "alt_" + core::IDGenerator::new_uuidv7_string(),
            .entity_id = resp.entity_id,
            .company_name = resp.canonical_company_name,
            .alert_type = "HIGH_CONVICTION_BREAKTHROUGH",
            .summary = resp.executive_summary,
            .timestamp = core::TimeUtils::current_iso8601(),
            .evidence_receipt_id = resp.evidence_receipt_id
        });
    }

    cycles_completed_++;
    spdlog::info("Autonomous Cycle #{} completed cleanly for entity '{}'.", cycles_completed_.load(), target_entity);
}

} // namespace vcbrain::intelligence::continuous
