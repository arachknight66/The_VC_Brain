#ifndef VCBRAIN_SECURITY_SPIFFE_SPIRE_HPP
#define VCBRAIN_SECURITY_SPIFFE_SPIRE_HPP

#include <string>
#include <optional>

namespace vcbrain::security {

class SPIFFEWorkloadValidator {
public:
    static bool validate_spiffe_id(const std::string& spiffe_id, const std::string& allowed_namespace = "vcbrain-prod");
    static std::optional<std::string> extract_spiffe_id_from_cert(const std::string& cert_pem);
};

} // namespace vcbrain::security

#endif // VCBRAIN_SECURITY_SPIFFE_SPIRE_HPP
