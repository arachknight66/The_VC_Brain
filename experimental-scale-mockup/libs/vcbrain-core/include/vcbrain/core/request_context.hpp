#ifndef VCBRAIN_CORE_REQUEST_CONTEXT_HPP
#define VCBRAIN_CORE_REQUEST_CONTEXT_HPP

#include <string>
#include <optional>

namespace vcbrain::core {

class RequestContext {
public:
    RequestContext(
        std::string trace_id,
        std::string correlation_id,
        std::string tenant_id = "vcbrain-default",
        std::optional<std::string> spiffe_id = std::nullopt
    );

    [[nodiscard]] const std::string& trace_id() const noexcept { return trace_id_; }
    [[nodiscard]] const std::string& correlation_id() const noexcept { return correlation_id_; }
    [[nodiscard]] const std::string& tenant_id() const noexcept { return tenant_id_; }
    [[nodiscard]] const std::optional<std::string>& spiffe_id() const noexcept { return spiffe_id_; }

    static void set_current(RequestContext context);
    static const RequestContext& current();
    static void clear();

private:
    std::string trace_id_;
    std::string correlation_id_;
    std::string tenant_id_;
    std::optional<std::string> spiffe_id_;
};

} // namespace vcbrain::core

#endif // VCBRAIN_CORE_REQUEST_CONTEXT_HPP
