#ifndef VCBRAIN_ENTITYRESOLUTION_APPLICATION_PORT_IN_RESOLVE_ENTITY_USE_CASE_HPP
#define VCBRAIN_ENTITYRESOLUTION_APPLICATION_PORT_IN_RESOLVE_ENTITY_USE_CASE_HPP

#include "vcbrain/entityresolution/domain/model/golden_record.hpp"
#include <string>
#include <memory>

namespace vcbrain::entityresolution::application::port::in {

struct ResolveEntityCommand {
    std::string raw_name;
    std::string primary_domain;
    std::string source_tier;
    std::string evidence_receipt_id;
};

struct ResolveEntityResult {
    domain::model::UUIDv7 entity_id;
    std::string canonical_name;
    double match_confidence;
    domain::model::EntityState final_state;
};

class ResolveEntityUseCase {
public:
    virtual ~ResolveEntityUseCase() = default;

    [[nodiscard]] virtual ResolveEntityResult execute(const ResolveEntityCommand& command) = 0;
};

} // namespace vcbrain::entityresolution::application::port::in

#endif // VCBRAIN_ENTITYRESOLUTION_APPLICATION_PORT_IN_RESOLVE_ENTITY_USE_CASE_HPP
