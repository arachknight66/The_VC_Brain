#ifndef VCBRAIN_SECURITY_AUTH_MIDDLEWARE_HPP
#define VCBRAIN_SECURITY_AUTH_MIDDLEWARE_HPP

#include <drogon/HttpFilter.h>
#include <string>

namespace vcbrain::security {

class AuthMiddleware : public drogon::HttpFilter<AuthMiddleware> {
public:
    AuthMiddleware() = default;

    void doFilter(
        const drogon::HttpRequestPtr& req,
        drogon::FilterCallback&& fcb,
        drogon::FilterChainCallback&& fccb
    ) override;
};

} // namespace vcbrain::security

#endif // VCBRAIN_SECURITY_AUTH_MIDDLEWARE_HPP
