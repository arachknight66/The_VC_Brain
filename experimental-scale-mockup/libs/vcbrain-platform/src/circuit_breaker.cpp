#include "vcbrain/platform/circuit_breaker.hpp"
#include "vcbrain/core/error_framework.hpp"

namespace vcbrain::platform {

CircuitBreaker::CircuitBreaker(
    std::string name,
    uint32_t failure_threshold,
    std::chrono::milliseconds recovery_timeout
) : name_(std::move(name)),
    failure_threshold_(failure_threshold),
    recovery_timeout_(recovery_timeout),
    last_failure_time_(std::chrono::system_clock::now()) {}

CircuitState CircuitBreaker::state() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return state_;
}

bool CircuitBreaker::allow_request() {
    std::lock_guard<std::mutex> lock(mutex_);
    auto now = std::chrono::system_clock::now();

    if (state_ == CircuitState::OPEN) {
        if (now - last_failure_time_ >= recovery_timeout_) {
            state_ = CircuitState::HALF_OPEN;
            return true;
        }
        return false;
    }
    return true;
}

void CircuitBreaker::record_success() {
    std::lock_guard<std::mutex> lock(mutex_);
    failure_count_ = 0;
    state_ = CircuitState::CLOSED;
}

void CircuitBreaker::record_failure() {
    std::lock_guard<std::mutex> lock(mutex_);
    failure_count_++;
    last_failure_time_ = std::chrono::system_clock::now();

    if (failure_count_ >= failure_threshold_) {
        state_ = CircuitState::OPEN;
    }
}

} // namespace vcbrain::platform
