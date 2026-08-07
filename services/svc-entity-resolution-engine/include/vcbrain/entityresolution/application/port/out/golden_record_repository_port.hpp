#ifndef VCBRAIN_ENTITYRESOLUTION_APPLICATION_PORT_OUT_GOLDEN_RECORD_REPOSITORY_PORT_HPP
#define VCBRAIN_ENTITYRESOLUTION_APPLICATION_PORT_OUT_GOLDEN_RECORD_REPOSITORY_PORT_HPP

#include "vcbrain/entityresolution/domain/model/golden_record.hpp"
#include <vector>
#include <optional>
#include <memory>

namespace vcbrain::entityresolution::application::port::out {

class GoldenRecordRepositoryPort {
public:
    virtual ~GoldenRecordRepositoryPort() = default;

    virtual void save(const domain::model::GoldenRecordAggregate& aggregate) = 0;
    [[nodiscard]] virtual std::optional<domain::model::GoldenRecordAggregate> find_by_id(const domain::model::UUIDv7& id) = 0;
    [[nodiscard]] virtual std::optional<domain::model::GoldenRecordAggregate> find_by_domain(const std::string& domain) = 0;
    [[nodiscard]] virtual std::vector<domain::model::GoldenRecordAggregate> find_candidates_by_name(const std::string& name_prefix) = 0;
};

} // namespace vcbrain::entityresolution::application::port::out

#endif // VCBRAIN_ENTITYRESOLUTION_APPLICATION_PORT_OUT_GOLDEN_RECORD_REPOSITORY_PORT_HPP
