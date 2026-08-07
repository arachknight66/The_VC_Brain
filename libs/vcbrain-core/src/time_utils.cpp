#include "vcbrain/core/time_utils.hpp"
#include <iomanip>
#include <sstream>
#include <ctime>

namespace vcbrain::core {

std::chrono::system_clock::time_point TimeUtils::now() noexcept {
    return std::chrono::system_clock::now();
}

std::string TimeUtils::to_iso8601_utc(std::chrono::system_clock::time_point tp) {
    auto time_t_val = std::chrono::system_clock::to_time_t(tp);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        tp.time_since_epoch()
    ) % 1000;

    std::tm tm_buf{};
#if defined(_WIN32) || defined(_WIN64)
    gmtime_s(&tm_buf, &time_t_val);
#else
    gmtime_r(&time_t_val, &tm_buf);
#endif

    std::stringstream ss;
    ss << std::put_time(&tm_buf, "%Y-%m-%dT%H:%M:%S")
       << '.' << std::setfill('0') << std::setw(3) << ms.count() << 'Z';

    return ss.str();
}

uint64_t TimeUtils::current_timestamp_ms() noexcept {
    return static_cast<uint64_t>(
        std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count()
    );
}

} // namespace vcbrain::core
