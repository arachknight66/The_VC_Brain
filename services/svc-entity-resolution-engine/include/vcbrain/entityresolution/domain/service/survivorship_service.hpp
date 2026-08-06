#ifndef VCBRAIN_ENTITYRESOLUTION_DOMAIN_SERVICE_SURVIVORSHIP_SERVICE_HPP
#define VCBRAIN_ENTITYRESOLUTION_DOMAIN_SERVICE_SURVIVORSHIP_SERVICE_HPP

#include "vcbrain/entityresolution/domain/model/golden_record.hpp"
#include <string>
#include <vector>

namespace vcbrain::entityresolution::domain::service {

class SurvivorshipDomainService {
public:
    SurvivorshipDomainService() = default;

    [[nodiscard]] double get_source_authority(const std::string& source_tier) const noexcept;

    void resolve_attribute_conflict(
        model::GoldenRecordAggregate& target_record,
        const std::string& attr_name,
        const std::string& attr_value,
        const std::string& source_tier,
        const std::string& evidence_receipt_id
    ) const;
};

} // namespace vcbrain::entityresolution::domain::service

#endif // VCBRAIN_ENTITYRESOLUTION_DOMAIN_SERVICE_SURVIVORSHIP_SERVICE_HPP
