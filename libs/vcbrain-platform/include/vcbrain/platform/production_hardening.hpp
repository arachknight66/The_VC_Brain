#ifndef VCBRAIN_PLATFORM_PRODUCTION_HARDENING_HPP
#define VCBRAIN_PLATFORM_PRODUCTION_HARDENING_HPP

#include <string>
#include <vector>
#include <mutex>
#include <atomic>
#include <chrono>

namespace vcbrain::platform {

class PromptSanitizer {
public:
    [[nodiscard]] static bool contains_prompt_injection(const std::string& input);
    [[nodiscard]] static std::string sanitize_prompt_input(const std::string& input);
};

class LoadShedder {
public:
    explicit LoadShedder(double max_cpu_threshold = 0.85);

    [[nodiscard]] bool should_shed_request(double current_cpu_load) const;
    void record_shedded_request();
    [[nodiscard]] uint64_t shedded_count() const noexcept { return shedded_count_.load(); }

private:
    double max_cpu_threshold_;
    mutable std::atomic<uint64_t> shedded_count_{0};
};

class Bulkhead {
public:
    explicit Bulkhead(size_t max_concurrent_calls = 50);

    [[nodiscard]] bool try_acquire();
    void release();
    [[nodiscard]] size_t active_calls() const noexcept { return active_calls_.load(); }

private:
    size_t max_concurrent_calls_;
    std::atomic<size_t> active_calls_{0};
};

class OWASPDefenses {
public:
    [[nodiscard]] static std::string sanitize_html_xss(const std::string& input);
    [[nodiscard]] static bool is_valid_url_ssrf_safe(const std::string& url);
    [[nodiscard]] static std::string escape_sql_injection(const std::string& input);
};

} // namespace vcbrain::platform

#endif // VCBRAIN_PLATFORM_PRODUCTION_HARDENING_HPP
