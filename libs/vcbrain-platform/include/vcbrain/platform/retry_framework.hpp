#ifndef VCBRAIN_PLATFORM_RETRY_FRAMEWORK_HPP
#define VCBRAIN_PLATFORM_RETRY_FRAMEWORK_HPP

#include <functional>
#include <chrono>
#include <thread>
#include <spdlog/spdlog.h>

namespace vcbrain::platform {

class RetryRunner {
public:
    template <typename Func>
    static auto execute_with_retry(
        Func&& func,
        uint32_t max_attempts = 3,
        std::chrono::milliseconds base_delay = std::chrono::milliseconds(25)
    ) {
        uint32_t attempt = 0;
        while (true) {
            try {
                attempt++;
                return func();
            } catch (const std::exception& ex) {
                if (attempt >= max_attempts) {
                    spdlog::error("RetryRunner failed after {} attempts: {}", attempt, ex.what());
                    throw;
                }
                auto delay = base_delay * (1 << (attempt - 1));
                spdlog::warn("RetryRunner attempt {} failed ({}). Retrying in {}ms...", attempt, ex.what(), delay.count());
                std::this_thread::sleep_for(delay);
            }
        }
    }
};

} // namespace vcbrain::platform

#endif // VCBRAIN_PLATFORM_RETRY_FRAMEWORK_HPP
