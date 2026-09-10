#include "vcbrain/observability/logging_framework.hpp"
#include <spdlog/sinks/stdout_color_sinks.h>

namespace vcbrain::observability {

void LoggingEngine::initialize(const std::string& service_name) {
    spdlog::set_pattern("{\"timestamp\":\"%Y-%m-%dT%H:%M:%S.%fZ\",\"level\":\"%l\",\"service_name\":\"" + service_name + "\",\"thread_id\":%t,\"message\":\"%v\"}");
    spdlog::set_level(spdlog::level::info);
    spdlog::info("Initialized VC Brain spdlog JSON logging engine for service: {}", service_name);
}

void LoggingEngine::set_level(spdlog::level::level_enum level) {
    spdlog::set_level(level);
}

} // namespace vcbrain::observability
