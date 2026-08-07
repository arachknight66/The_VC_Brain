#ifndef VCBRAIN_ENTITYRESOLUTION_APPLICATION_SERVICE_ENTITY_RESOLUTION_APPLICATION_SERVICE_HPP
#define VCBRAIN_ENTITYRESOLUTION_APPLICATION_SERVICE_ENTITY_RESOLUTION_APPLICATION_SERVICE_HPP

#include "vcbrain/entityresolution/application/port/in/resolve_entity_use_case.hpp"
#include "vcbrain/entityresolution/application/port/out/golden_record_repository_port.hpp"
#include "vcbrain/entityresolution/domain/service/blocking_service.hpp"
#include "vcbrain/entityresolution/domain/service/survivorship_service.hpp"
#include <memory>

namespace vcbrain::entityresolution::application::service {

class EntityResolutionApplicationService : public port::in::ResolveEntityUseCase {
public:
    EntityResolutionApplicationService(
        std::shared_ptr<port::out::GoldenRecordRepositoryPort> repository,
        std::shared_ptr<domain::service::BlockingDomainService> blocking_service,
        std::shared_ptr<domain::service::SurvivorshipDomainService> survivorship_service
    );

    [[nodiscard]] port::in::ResolveEntityResult execute(const port::in::ResolveEntityCommand& command) override;

private:
    std::shared_ptr<port::out::GoldenRecordRepositoryPort> repository_;
    std::shared_ptr<domain::service::BlockingDomainService> blocking_service_;
    std::shared_ptr<domain::service::SurvivorshipDomainService> survivorship_service_;
};

} // namespace vcbrain::entityresolution::application::service

#endif // VCBRAIN_ENTITYRESOLUTION_APPLICATION_SERVICE_ENTITY_RESOLUTION_APPLICATION_SERVICE_HPP
