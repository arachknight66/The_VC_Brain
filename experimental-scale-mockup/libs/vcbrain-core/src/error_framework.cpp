#include "vcbrain/core/error_framework.hpp"
#include "vcbrain/core/request_context.hpp"

namespace vcbrain::core {

Exception::Exception(std::string error_code, std::string message, int status_code)
    : std::runtime_error(message),
      error_code_(std::move(error_code)),
      status_code_(status_code) {}

nlohmann::json Exception::to_rfc7807_json() const {
    const auto& ctx = RequestContext::current();
    return nlohmann::json{
        {"type", "https://vcbrain.internal/errors/" + error_code_},
        {"title", error_code_},
        {"status", status_code_},
        {"detail", what()},
        {"trace_id", ctx.trace_id()},
        {"correlation_id", ctx.correlation_id()}
    };
}

} // namespace vcbrain::core
