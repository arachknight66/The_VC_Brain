#ifndef VCBRAIN_INTELLIGENCE_EVIDENCE_HPP
#define VCBRAIN_INTELLIGENCE_EVIDENCE_HPP

#include "vcbrain/core/id_generator.hpp"
#include <string>
#include <vector>
#include <chrono>

namespace vcbrain::intelligence::evidence {

struct EvidenceReceipt {
    std::string receipt_id;
    std::string entity_id;
    std::string claim_type;
    std::string claim_value;
    std::string source_url;
    std::string content_hash_sha256;
    double authority_score{1.0};
    std::chrono::system_clock::time_point timestamp;
};

class EvidenceRegistry {
public:
    EvidenceRegistry() = default;

    std::string register_evidence(
        const std::string& entity_id,
        const std::string& claim_type,
        const std::string& claim_value,
        const std::string& source_url,
        double authority_score = 1.0
    );

    [[nodiscard]] std::vector<EvidenceReceipt> get_evidence_for_entity(const std::string& entity_id) const;
    [[nodiscard]] bool verify_integrity(const std::string& receipt_id) const;

private:
    std::vector<EvidenceReceipt> receipts_;
};

} // namespace vcbrain::intelligence::evidence

#endif // VCBRAIN_INTELLIGENCE_EVIDENCE_HPP
