#ifndef VCBRAIN_ENTITYRESOLUTION_DOMAIN_MODEL_GOLDEN_RECORD_HPP
#define VCBRAIN_ENTITYRESOLUTION_DOMAIN_MODEL_GOLDEN_RECORD_HPP

#include <string>
#include <vector>
#include <chrono>
#include <optional>
#include <memory>
#include <stdexcept>

namespace vcbrain::entityresolution::domain::model {

enum class EntityState {
    UNRESOLVED,
    AUTO_MERGED,
    STEWARD_QUEUED,
    NEW_ENTITY,
    ENTITY_SPLIT
};

struct UUIDv7 {
    std::string value;

    static UUIDv7 generate();
    bool operator==(const UUIDv7& other) const = default;
};

struct AttributeSurvivorship {
    std::string attribute_name;
    std::string attribute_value;
    double source_authority{0.0};
    std::string evidence_receipt_id;
    std::chrono::system_clock::time_point asserted_at;
};

class GoldenRecordAggregate {
public:
    GoldenRecordAggregate(
        UUIDv7 entity_id,
        std::string canonical_name,
        std::string primary_domain,
        double authority_score = 1.0
    );

    [[nodiscard]] const UUIDv7& get_entity_id() const noexcept { return entity_id_; }
    [[nodiscard]] const std::string& get_canonical_name() const noexcept { return canonical_name_; }
    [[nodiscard]] const std::string& get_primary_domain() const noexcept { return primary_domain_; }
    [[nodiscard]] EntityState get_state() const noexcept { return state_; }
    [[nodiscard]] double get_authority_score() const noexcept { return authority_score_; }
    [[nodiscard]] uint64_t get_version() const noexcept { return version_; }
    [[nodiscard]] const std::vector<AttributeSurvivorship>& get_attributes() const noexcept { return attributes_; }

    void add_attribute(AttributeSurvivorship attr);
    void transition_to(EntityState target_state);
    void merge(std::shared_ptr<GoldenRecordAggregate> secondary_entity);
    void split(const std::string& rationale);

private:
    UUIDv7 entity_id_;
    std::string canonical_name_;
    std::string primary_domain_;
    EntityState state_{EntityState::UNRESOLVED};
    double authority_score_{1.0};
    uint64_t version_{1};
    std::vector<AttributeSurvivorship> attributes_;
    std::chrono::system_clock::time_point valid_from_;
    std::chrono::system_clock::time_point tx_from_;
};

} // namespace vcbrain::entityresolution::domain::model

#endif // VCBRAIN_ENTITYRESOLUTION_DOMAIN_MODEL_GOLDEN_RECORD_HPP
