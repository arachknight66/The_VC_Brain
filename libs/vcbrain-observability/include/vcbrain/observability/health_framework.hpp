#ifndef VCBRAIN_OBSERVABILITY_HEALTH_FRAMEWORK_HPP
#define VCBRAIN_OBSERVABILITY_HEALTH_FRAMEWORK_HPP

#include <string>
#include <functional>
#include <unordered_map>
#include <mutex>
#include <nlohmann/json.hpp>

namespace vcbrain::observability {

enum class SubsystemStatus {
    UP,
    DEGRADED,
    DOWN
};

using HealthCheckFn = std::function<SubsystemStatus()>;

class HealthChecker {
public:
    static HealthChecker& instance();

    void register_subsystem(const std::string& name, HealthCheckFn fn);
    [[nodiscard]] nlohmann::json evaluate_health() const;

private:
    HealthChecker() = default;
    mutable std::mutex mutex_;
    std::unordered_map<std::string, HealthCheckFn> checkers_;
};

} // namespace vcbrain::observability

#endif // VCBRAIN_OBSERVABILITY_HEALTH_FRAMEWORK_HPP
