#include "vcbrain/entityresolution/domain/service/blocking_service.hpp"
#include <algorithm>
#include <cctype>
#include <functional>

namespace vcbrain::entityresolution::domain::service {

std::string BlockingDomainService::compute_exact_domain_hash(const std::string& domain) const {
    std::string clean = domain;
    std::transform(clean.begin(), clean.end(), clean.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });
    if (clean.starts_with("www.")) {
        clean = clean.substr(4);
    }
    return clean;
}

std::string BlockingDomainService::compute_phonetic_name_key(const std::string& name) const {
    std::string key;
    key.reserve(name.size());
    for (char c : name) {
        if (std::isalnum(static_cast<unsigned char>(c))) {
            key.push_back(static_cast<char>(std::toupper(static_cast<unsigned char>(c))));
        }
    }
    return key;
}

std::vector<uint64_t> BlockingDomainService::compute_minhash_signature(const std::string& text) const {
    std::vector<uint64_t> signature(16, 0ULL);
    std::hash<std::string> hasher;
    uint64_t base_hash = hasher(text);
    
    for (size_t i = 0; i < 16; ++i) {
        signature[i] = base_hash ^ (i * 0x9E3779B97F4A7C15ULL);
    }
    return signature;
}

std::vector<CandidatePair> BlockingDomainService::evaluate_4pass_blocking(
    const std::string& raw_name,
    const std::string& primary_domain,
    const std::vector<model::GoldenRecordAggregate>& existing_candidates
) const {
    std::vector<CandidatePair> results;
    std::string target_domain_hash = compute_exact_domain_hash(primary_domain);
    std::string target_phonetic_key = compute_phonetic_name_key(raw_name);

    model::UUIDv7 incoming_id = model::UUIDv7::generate();

    for (const auto& candidate : existing_candidates) {
        double sim = 0.0;
        std::string pass_source = "NONE";

        // Pass 1: Exact Domain Matching
        if (!target_domain_hash.empty() && compute_exact_domain_hash(candidate.get_primary_domain()) == target_domain_hash) {
            sim = 1.0;
            pass_source = "PASS_1_EXACT_DOMAIN";
        }
        // Pass 2: Phonetic Key Matching
        else if (compute_phonetic_name_key(candidate.get_canonical_name()) == target_phonetic_key) {
            sim = 0.88;
            pass_source = "PASS_2_PHONETIC_KEY";
        }

        if (sim > 0.5) {
            double ml_prob = sim >= 0.95 ? 0.98 : (sim * 0.92);
            results.push_back(CandidatePair{
                .incoming_id = incoming_id,
                .target_id = candidate.get_entity_id(),
                .composite_similarity = sim,
                .ml_match_probability = ml_prob,
                .blocking_pass_source = pass_source
            });
        }
    }

    return results;
}

} // namespace vcbrain::entityresolution::domain::service
