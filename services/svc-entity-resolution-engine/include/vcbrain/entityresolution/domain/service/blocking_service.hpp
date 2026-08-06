#ifndef VCBRAIN_ENTITYRESOLUTION_DOMAIN_SERVICE_BLOCKING_SERVICE_HPP
#define VCBRAIN_ENTITYRESOLUTION_DOMAIN_SERVICE_BLOCKING_SERVICE_HPP

#include "vcbrain/entityresolution/domain/model/golden_record.hpp"
#include <string>
#include <vector>

namespace vcbrain::entityresolution::domain::service {

struct CandidatePair {
    model::UUIDv7 incoming_id;
    model::UUIDv7 target_id;
    double composite_similarity{0.0};
    double ml_match_probability{0.0};
    std::string blocking_pass_source;
};

class BlockingDomainService {
public:
    BlockingDomainService() = default;

    [[nodiscard]] std::string compute_exact_domain_hash(const std::string& domain) const;
    [[nodiscard]] std::string compute_phonetic_name_key(const std::string& name) const;
    [[nodiscard]] std::vector<uint64_t> compute_minhash_signature(const std::string& text) const;

    [[nodiscard]] std::vector<CandidatePair> evaluate_4pass_blocking(
        const std::string& raw_name,
        const std::string& primary_domain,
        const std::vector<model::GoldenRecordAggregate>& existing_candidates
    ) const;
};

} // namespace vcbrain::entityresolution::domain::service

#endif // VCBRAIN_ENTITYRESOLUTION_DOMAIN_SERVICE_BLOCKING_SERVICE_HPP
