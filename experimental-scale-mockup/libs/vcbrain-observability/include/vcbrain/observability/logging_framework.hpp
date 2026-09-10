#ifndef VCBRAIN_OBSERVABILITY_LOGGING_FRAMEWORK_HPP
#define VCBRAIN_OBSERVABILITY_LOGGING_FRAMEWORK_HPP

#include <string>
#include <spdlog/spdlog.h>

namespace vcbrain::observability {

class LoggingEngine {
public:
    static void initialize(const std::string& service_name);
    static void set_level(spdlog::level::level_enum level);
};

} // namespace vcbrain::observability

#endif // VCBRAIN_OBSERVABILITY_LOGGING_FRAMEWORK_HPP
