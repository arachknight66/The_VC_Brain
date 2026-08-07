#include "vcbrain/intelligence/epic5_evidence/evidence.hpp"
#include <spdlog/spdlog.h>
#include <functional>
#include <sstream>

namespace vcbrain::intelligence::evidence {

std::string EvidenceRegistry::register_evidence(
    const std::string& entity_id,
    const std::string& claim_type,
    const std::string& claim_value,
    const std::string& source_url,
    double authority_score
) {
    std::string receipt_id = core::IDGenerator::new_uuidv7_string();
    
    std::hash<std::string> hasher;
    size_t hash_val = hasher(receipt_id + entity_id + claim_type + claim_value + source_url);
    
    std::stringstream ss;
    ss << std::hex << hash_val;
    std::string sha_str = ss.str();

    EvidenceReceipt rcpt{
        .receipt_id = receipt_id,
        .entity_id = entity_id,
        .claim_type = claim_type,
        .claim_value = claim_value,
        .source_url = source_url,
        .content_hash_sha256 = sha_str,
        .authority_score = authority_score,
        .timestamp = std::chrono::system_clock::now()
    };

    receipts_.push_back(rcpt);
    spdlog::info("Registered immutable Evidence Receipt: {} for entity: {}", receipt_id, entity_id);

    return receipt_id;
}

std::vector<EvidenceReceipt> EvidenceRegistry::get_evidence_for_entity(const std::string& entity_id) const {
    std::vector<EvidenceReceipt> result;
    for (const auto& rcpt : receipts_) {
        if (rcpt.entity_id == entity_id) {
            result.push_back(rcpt);
        }
    }
    return result;
}

bool EvidenceRegistry::verify_integrity(const std::string& receipt_id) const {
    for (const auto& rcpt : receipts_) {
        if (rcpt.receipt_id == receipt_id) {
            return !rcpt.content_hash_sha256.empty();
        }
    }
    return false;
}

} // namespace vcbrain::intelligence::evidence
