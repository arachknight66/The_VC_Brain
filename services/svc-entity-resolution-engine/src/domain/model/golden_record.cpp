#include "vcbrain/entityresolution/domain/model/golden_record.hpp"
#include <random>
#include <sstream>
#include <iomanip>

namespace vcbrain::entityresolution::domain::model {

UUIDv7 UUIDv7::generate() {
    static std::random_device rd;
    static std::mt19937_64 gen(rd());
    static std::uniform_int_distribution<uint64_t> dis;

    auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()
    ).count();

    uint64_t rand_a = dis(gen);
    
    std::stringstream ss;
    ss << std::hex << std::setfill('0')
       << std::setw(12) << now
       << "-"
       << std::setw(4) << ((rand_a >> 48) & 0x0FFF | 0x7000)
       << "-"
       << std::setw(4) << ((rand_a >> 32) & 0x3FFF | 0x8000)
       << "-"
       << std::setw(12) << (rand_a & 0xFFFFFFFFFFFFULL);
    
    return UUIDv7{ss.str()};
}

GoldenRecordAggregate::GoldenRecordAggregate(
    UUIDv7 entity_id,
    std::string canonical_name,
    std::string primary_domain,
    double authority_score
) : entity_id_(std::move(entity_id)),
    canonical_name_(std::move(canonical_name)),
    primary_domain_(std::move(primary_domain)),
    authority_score_(authority_score),
    valid_from_(std::chrono::system_clock::now()),
    tx_from_(std::chrono::system_clock::now()) {}

void GoldenRecordAggregate::add_attribute(AttributeSurvivorship attr) {
    attributes_.push_back(std::move(attr));
    version_++;
}

void GoldenRecordAggregate::transition_to(EntityState target_state) {
    state_ = target_state;
    version_++;
}

void GoldenRecordAggregate::merge(std::shared_ptr<GoldenRecordAggregate> secondary_entity) {
    if (!secondary_entity) return;
    
    for (const auto& attr : secondary_entity->get_attributes()) {
        add_attribute(attr);
    }
    
    state_ = EntityState::AUTO_MERGED;
    version_++;
}

void GoldenRecordAggregate::split(const std::string& /*rationale*/) {
    state_ = EntityState::ENTITY_SPLIT;
    version_++;
}

} // namespace vcbrain::entityresolution::domain::model
