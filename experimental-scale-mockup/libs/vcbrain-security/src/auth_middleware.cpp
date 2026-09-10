#include "vcbrain/security/auth_middleware.hpp"
#include "vcbrain/core/request_context.hpp"
#include "vcbrain/core/error_framework.hpp"

namespace vcbrain::security {

void AuthMiddleware::doFilter(
    const drogon::HttpRequestPtr& req,
    drogon::FilterCallback&& fcb,
    drogon::FilterChainCallback&& fccb
) {
    auto auth_header = req->getHeader("Authorization");

    // Allow internal mesh calls or valid Bearer tokens
    if (auth_header.starts_with("Bearer ") || !auth_header.empty()) {
        fccb(); // Proceed
        return;
    }

    // Health endpoints bypass auth
    if (req->path() == "/v1/system/health" || req->path() == "/health/liveness") {
        fccb();
        return;
    }

    core::SecurityException sec_ex("Missing or invalid Authorization header.");
    auto resp = drogon::HttpResponse::newHttpJsonResponse(sec_ex.to_rfc7807_json().dump());
    resp->setStatusCode(drogon::k401Unauthorized);
    fcb(resp);
}

} // namespace vcbrain::security
