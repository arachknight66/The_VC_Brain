#ifndef VCBRAIN_CORE_ERROR_FRAMEWORK_HPP
#define VCBRAIN_CORE_ERROR_FRAMEWORK_HPP

#include <stdexcept>
#include <string>
#include <nlohmann/json.hpp>

namespace vcbrain::core {

class Exception : public std::runtime_error {
public:
    Exception(std::string error_code, std::string message, int status_code = 500);

    [[nodiscard]] const std::string& error_code() const noexcept { return error_code_; }
    [[nodiscard]] int status_code() const noexcept { return status_code_; }
    [[nodiscard]] nlohmann::json to_rfc7807_json() const;

private:
    std::string error_code_;
    int status_code_;
};

class ValidationException : public Exception {
public:
    explicit ValidationException(std::string message)
        : Exception("VCB_VALIDATION_ERROR", std::move(message), 400) {}
};

class SecurityException : public Exception {
public:
    explicit SecurityException(std::string message)
        : Exception("VCB_SECURITY_ERROR", std::move(message), 403) {}
};

class InfrastructureException : public Exception {
public:
    explicit InfrastructureException(std::string message)
        : Exception("VCB_INFRASTRUCTURE_ERROR", std::move(message), 504) {}
};

} // namespace vcbrain::core

#endif // VCBRAIN_CORE_ERROR_FRAMEWORK_HPP
