#include "vcbrain/observability/metrics_framework.hpp"

namespace vcbrain::observability {

MetricsRegistry& MetricsRegistry::instance() {
    static MetricsRegistry instance;
    return instance;
}

void MetricsRegistry::increment_counter(const std::string& metric_name, uint64_t amount) {
    std::lock_guard<std::mutex> lock(mutex_);
    counters_[metric_name] += amount;
}

uint64_t MetricsRegistry::get_counter(const std::string& metric_name) const {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = counters_.find(metric_name);
    return (it != counters_.end()) ? it->second : 0ULL;
}

} // namespace vcbrain::observability
