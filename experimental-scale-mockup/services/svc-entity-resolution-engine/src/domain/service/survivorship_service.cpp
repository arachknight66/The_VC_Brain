#include "vcbrain/entityresolution/domain/service/survivorship_service.hpp"

namespace vcbrain::entityresolution::domain::service {

double SurvivorshipDomainService::get_source_authority(const std::string& source_tier) const noexcept {
    if (source_tier == "sec_edgar" || source_tier == "uspto" || source_tier == "regulatory") return 1.0;
    if (source_tier == "official_domain" || source_tier == "github_org") return 0.85;
    if (source_tier == "crunchbase" || source_tier == "pitchbook" || source_tier == "openalex") return 0.70;
    return 0.50; // Unstructured News & Press Releases
}

void SurvivorshipDomainService::resolve_attribute_conflict(
    model::GoldenRecordAggregate& target_record,
    const std::string& attr_name,
    const std::string& attr_value,
    const std::string& source_tier,
    const std::string& evidence_receipt_id
) const {
    double authority = get_source_authority(source_tier);

    target_record.add_attribute(model::AttributeSurvivorship{
        .attribute_name = attr_name,
        .attribute_value = attr_value,
        .source_authority = authority,
        .evidence_receipt_id = evidence_receipt_id,
        .asserted_at = std::chrono::system_clock::now()
    });
}

} // namespace vcbrain::entityresolution::domain::service
