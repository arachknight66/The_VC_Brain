#ifndef VCBRAIN_PLATFORM_CIRCUIT_BREAKER_HPP
#define VCBRAIN_PLATFORM_CIRCUIT_BREAKER_HPP

#include <string>
#include <chrono>
#include <mutex>
#include <functional>

namespace vcbrain::platform {

enum class CircuitState {
    CLOSED,
    OPEN,
    HALF_OPEN
};

class CircuitBreaker {
public:
    CircuitBreaker(
        std::string name,
        uint32_t failure_threshold = 3,
        std::chrono::milliseconds recovery_timeout = std::chrono::milliseconds(30000)
    );

    [[nodiscard]] const std::string& name() const noexcept { return name_; }
    [[nodiscard]] CircuitState state() const;

    bool allow_request();
    void record_success();
    void record_failure();

private:
    std::string name_;
    uint32_t failure_threshold_;
    std::chrono::milliseconds recovery_timeout_;
    
    mutable std::mutex mutex_;
    CircuitState state_{CircuitState::CLOSED};
    uint32_t failure_count_{0};
    std::chrono::system_clock::time_point last_failure_time_;
};

} // namespace vcbrain::platform

#endif // VCBRAIN_PLATFORM_CIRCUIT_BREAKER_HPP
