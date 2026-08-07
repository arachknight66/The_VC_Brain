#ifndef VCBRAIN_INTELLIGENCE_CONTINUOUS_CONTINUOUS_ENGINE_HPP
#define VCBRAIN_INTELLIGENCE_CONTINUOUS_CONTINUOUS_ENGINE_HPP

#include <string>
#include <vector>
#include <chrono>
#include <mutex>
#include <atomic>
#include <nlohmann/json.hpp>

namespace vcbrain::intelligence::continuous {

enum class EntityFreshnessTier {
    BREAKING_NEWS,      // 15 minutes
    HIGH_PRIORITY,      // 6 hours
    WATCHED_ENTITY,     // 24 hours (Daily)
    GENERAL_ENTITY,     // 7 days (Weekly)
    DORMANT_ENTITY      // 30 days (Monthly)
};

struct AlertNotification {
    std::string alert_id;
    std::string entity_id;
    std::string company_name;
    std::string alert_type; // "FUNDING_ROUND", "FOUNDER_JOINED", "PATENT_FILED", "STAR_BURST"
    std::string summary;
    std::string timestamp;
    std::string evidence_receipt_id;
};

class FreshnessPolicyManager {
public:
    [[nodiscard]] static std::chrono::minutes get_refresh_interval(EntityFreshnessTier tier);
    [[nodiscard]] static bool is_stale(const std::string& last_updated_iso8601, EntityFreshnessTier tier);
};

class AlertEngine {
public:
    static AlertEngine& instance();

    void dispatch_alert(const AlertNotification& alert);
    [[nodiscard]] std::vector<AlertNotification> get_recent_alerts() const;

private:
    AlertEngine() = default;
    mutable std::mutex mutex_;
    std::vector<AlertNotification> alert_history_;
};

class AutonomousScheduler {
public:
    static AutonomousScheduler& instance();

    void start_autonomous_cycle();
    void stop_autonomous_cycle();
    [[nodiscard]] bool is_running() const noexcept { return running_.load(); }
    [[nodiscard]] uint64_t cycles_completed() const noexcept { return cycles_completed_.load(); }

    void trigger_manual_cycle(const std::string& target_entity);

private:
    AutonomousScheduler() = default;

    std::atomic<bool> running_{false};
    std::atomic<uint64_t> cycles_completed_{0};
};

} // namespace vcbrain::intelligence::continuous

#endif // VCBRAIN_INTELLIGENCE_CONTINUOUS_CONTINUOUS_ENGINE_HPP
