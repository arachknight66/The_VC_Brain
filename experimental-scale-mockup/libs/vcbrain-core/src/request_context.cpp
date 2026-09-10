#include "vcbrain/core/request_context.hpp"
#include "vcbrain/core/id_generator.hpp"

namespace vcbrain::core {

thread_local std::optional<RequestContext> g_thread_request_context;

RequestContext::RequestContext(
    std::string trace_id,
    std::string correlation_id,
    std::string tenant_id,
    std::optional<std::string> spiffe_id
) : trace_id_(std::move(trace_id)),
    correlation_id_(std::move(correlation_id)),
    tenant_id_(std::move(tenant_id)),
    spiffe_id_(std::move(spiffe_id)) {}

void RequestContext::set_current(RequestContext context) {
    g_thread_request_context = std::move(context);
}

const RequestContext& RequestContext::current() {
    if (!g_thread_request_context.has_value()) {
        g_thread_request_context = RequestContext(
            IDGenerator::new_uuidv7_string(),
            IDGenerator::new_uuidv7_string()
        );
    }
    return *g_thread_request_context;
}

void RequestContext::clear() {
    g_thread_request_context.reset();
}

} // namespace vcbrain::core
