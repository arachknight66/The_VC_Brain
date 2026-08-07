#ifndef VCBRAIN_OBSERVABILITY_METRICS_FRAMEWORK_HPP
#define VCBRAIN_OBSERVABILITY_METRICS_FRAMEWORK_HPP

#include <string>
#include <atomic>
#include <unordered_map>
#include <mutex>

namespace vcbrain::observability {

class MetricsRegistry {
public:
    static MetricsRegistry& instance();

    void increment_counter(const std::string& metric_name, uint64_t amount = 1);
    [[nodiscard]] uint64_t get_counter(const std::string& metric_name) const;

private:
    MetricsRegistry() = default;
    mutable std::mutex mutex_;
    std::unordered_map<std::string, uint64_t> counters_;
};

} // namespace vcbrain::observability

#endif // VCBRAIN_OBSERVABILITY_METRICS_FRAMEWORK_HPP
