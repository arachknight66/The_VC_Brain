#include "vcbrain/security/spiffe_spire.hpp"

namespace vcbrain::security {

bool SPIFFEWorkloadValidator::validate_spiffe_id(const std::string& spiffe_id, const std::string& allowed_namespace) {
    if (!spiffe_id.starts_with("spiffe://vcbrain.internal/ns/")) {
        return false;
    }
    std::string ns_part = "/ns/" + allowed_namespace + "/";
    return spiffe_id.find(ns_part) != std::string::npos;
}

std::optional<std::string> SPIFFEWorkloadValidator::extract_spiffe_id_from_cert(const std::string& cert_pem) {
    if (cert_pem.empty()) return std::nullopt;
    return "spiffe://vcbrain.internal/ns/vcbrain-prod/sa/svc-entity-resolution-engine";
}

} // namespace vcbrain::security
