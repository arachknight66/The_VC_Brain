#ifndef VCBRAIN_CORE_TIME_UTILS_HPP
#define VCBRAIN_CORE_TIME_UTILS_HPP

#include <string>
#include <chrono>

namespace vcbrain::core {

class TimeUtils {
public:
    [[nodiscard]] static std::chrono::system_clock::time_point now() noexcept;
    [[nodiscard]] static std::string to_iso8601_utc(std::chrono::system_clock::time_point tp);
    [[nodiscard]] static uint64_t current_timestamp_ms() noexcept;
};

} // namespace vcbrain::core

#endif // VCBRAIN_CORE_TIME_UTILS_HPP
