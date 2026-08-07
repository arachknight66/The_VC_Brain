#ifndef VCBRAIN_ENTITYRESOLUTION_WEB_REST_ENTITY_RESOLUTION_CONTROLLER_HPP
#define VCBRAIN_ENTITYRESOLUTION_WEB_REST_ENTITY_RESOLUTION_CONTROLLER_HPP

#include <drogon/HttpController.h>
#include "vcbrain/entityresolution/application/port/in/resolve_entity_use_case.hpp"
#include <memory>

namespace vcbrain::entityresolution::web::rest {

class EntityResolutionController : public drogon::HttpController<EntityResolutionController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(EntityResolutionController::resolve_entity, "/v1/entities/resolve", drogon::Post);
    ADD_METHOD_TO(EntityResolutionController::get_health, "/v1/system/health", drogon::Get);
    METHOD_LIST_END

    EntityResolutionController();
    explicit EntityResolutionController(std::shared_ptr<application::port::in::ResolveEntityUseCase> use_case);

    void resolve_entity(
        const drogon::HttpRequestPtr& req,
        std::function<void(const drogon::HttpResponsePtr&)>&& callback
    );

    void get_health(
        const drogon::HttpRequestPtr& req,
        std::function<void(const drogon::HttpResponsePtr&)>&& callback
    );

private:
    std::shared_ptr<application::port::in::ResolveEntityUseCase> use_case_;
};

} // namespace vcbrain::entityresolution::web::rest

#endif // VCBRAIN_ENTITYRESOLUTION_WEB_REST_ENTITY_RESOLUTION_CONTROLLER_HPP
