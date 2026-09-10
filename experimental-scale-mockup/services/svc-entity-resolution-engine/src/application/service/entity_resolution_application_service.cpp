#include "vcbrain/entityresolution/application/service/entity_resolution_application_service.hpp"
#include <spdlog/spdlog.h>

namespace vcbrain::entityresolution::application::service {

EntityResolutionApplicationService::EntityResolutionApplicationService(
    std::shared_ptr<port::out::GoldenRecordRepositoryPort> repository,
    std::shared_ptr<domain::service::BlockingDomainService> blocking_service,
    std::shared_ptr<domain::service::SurvivorshipDomainService> survivorship_service
) : repository_(std::move(repository)),
    blocking_service_(std::move(blocking_service)),
    survivorship_service_(std::move(survivorship_service)) {}

port::in::ResolveEntityResult EntityResolutionApplicationService::execute(const port::in::ResolveEntityCommand& command) {
    spdlog::info("Executing entity resolution for raw_name: '{}', domain: '{}'", command.raw_name, command.primary_domain);

    // 1. Check exact domain crosswalk
    if (repository_) {
        auto existing = repository_->find_by_domain(command.primary_domain);
        if (existing.has_value()) {
            spdlog::info("Exact domain crosswalk match found: {}", existing->get_entity_id().value);
            return port::in::ResolveEntityResult{
                .entity_id = existing->get_entity_id(),
                .canonical_name = existing->get_canonical_name(),
                .match_confidence = 1.0,
                .final_state = domain::model::EntityState::AUTO_MERGED
            };
        }
    }

    // 2. Perform 4-Pass Candidate Blocking
    std::vector<domain::model::GoldenRecordAggregate> candidates;
    if (repository_) {
        candidates = repository_->find_candidates_by_name(command.raw_name);
    }

    auto blocked_pairs = blocking_service_->evaluate_4pass_blocking(command.raw_name, command.primary_domain, candidates);

    if (!blocked_pairs.empty() && blocked_pairs.front().ml_match_probability >= 0.92) {
        const auto& best_match = blocked_pairs.front();
        spdlog::info("High-confidence candidate match found: {} (P = {})", best_match.target_id.value, best_match.ml_match_probability);

        return port::in::ResolveEntityResult{
            .entity_id = best_match.target_id,
            .canonical_name = command.raw_name,
            .match_confidence = best_match.ml_match_probability,
            .final_state = domain::model::EntityState::AUTO_MERGED
        };
    }

    // 3. Create New Golden Master Record if no candidate matches
    domain::model::UUIDv7 new_id = domain::model::UUIDv7::generate();
    domain::model::GoldenRecordAggregate new_record(new_id, command.raw_name, command.primary_domain);
    
    survivorship_service_->resolve_attribute_conflict(
        new_record, "canonical_name", command.raw_name, command.source_tier, command.evidence_receipt_id
    );
    
    new_record.transition_to(domain::model::EntityState::NEW_ENTITY);

    if (repository_) {
        repository_->save(new_record);
    }

    spdlog::info("Created new Golden Master Entity Record: {}", new_id.value);

    return port::in::ResolveEntityResult{
        .entity_id = new_id,
        .canonical_name = command.raw_name,
        .match_confidence = 0.50,
        .final_state = domain::model::EntityState::NEW_ENTITY
    };
}

} // namespace vcbrain::entityresolution::application::service
