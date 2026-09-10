#include "vcbrain/observability/health_framework.hpp"

namespace vcbrain::observability {

HealthChecker& HealthChecker::instance() {
    static HealthChecker instance;
    return instance;
}

void HealthChecker::register_subsystem(const std::string& name, HealthCheckFn fn) {
    std::lock_guard<std::mutex> lock(mutex_);
    checkers_[name] = std::move(fn);
}

nlohmann::json HealthChecker::evaluate_health() const {
    std::lock_guard<std::mutex> lock(mutex_);
    nlohmann::json result = {
        {"status", "UP"},
        {"subsystems", nlohmann::json::object()}
    };

    bool overall_down = false;
    bool overall_degraded = false;

    for (const auto& [name, fn] : checkers_) {
        SubsystemStatus st = fn();
        std::string st_str = "UP";
        if (st == SubsystemStatus::DEGRADED) {
            st_str = "DEGRADED";
            overall_degraded = true;
        } else if (st == SubsystemStatus::DOWN) {
            st_str = "DOWN";
            overall_down = true;
        }
        result["subsystems"][name] = st_str;
    }

    if (overall_down) result["status"] = "DOWN";
    else if (overall_degraded) result["status"] = "DEGRADED";

    return result;
}

} // namespace vcbrain::observability
