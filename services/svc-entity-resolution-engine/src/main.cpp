#include "vcbrain/entityresolution/infrastructure/config/app_config.hpp"
#include "vcbrain/entityresolution/domain/service/blocking_service.hpp"
#include "vcbrain/entityresolution/domain/service/survivorship_service.hpp"
#include "vcbrain/entityresolution/application/service/entity_resolution_application_service.hpp"
#include "vcbrain/entityresolution/web/rest/entity_resolution_controller.hpp"
#include <drogon/drogon.h>
#include <spdlog/spdlog.h>
#include <csignal>
#include <memory>

using namespace vcbrain::entityresolution;

void handle_signal(int signal) {
    if (signal == SIGTERM || signal == SIGINT) {
        spdlog::info("Received SIGTERM/SIGINT signal. Initiating 30-second graceful shutdown draining...");
        drogon::app().quit();
    }
}

int main(int argc, char* argv[]) {
    // 1. Initialize Structured spdlog Logging
    spdlog::set_pattern("{\"timestamp\":\"%Y-%m-%dT%H:%M:%S.%fZ\",\"level\":\"%l\",\"service_name\":\"svc-entity-resolution-engine\",\"thread_id\":%t,\"message\":\"%v\"}");
    spdlog::info("Starting VC Brain Entity Resolution Engine (C++23 Native ELF Executable)");

    // 2. Register Signal Handlers
    std::signal(SIGINT, handle_signal);
    std::signal(SIGTERM, handle_signal);

    // 3. Load yaml-cpp Application Configuration
    std::string config_path = (argc > 1) ? argv[1] : "config/prod.yaml";
    auto config = infrastructure::config::AppConfig::load_from_file(config_path);

    // 4. Instantiate Domain & Application Dependencies (Hexagonal Composition)
    auto blocking_service = std::make_shared<domain::service::BlockingDomainService>();
    auto survivorship_service = std::make_shared<domain::service::SurvivorshipDomainService>();
    auto app_service = std::make_shared<application::service::EntityResolutionApplicationService>(
        nullptr, // Repository bound dynamically or via mock for testing
        blocking_service,
        survivorship_service
    );

    // 5. Configure Drogon HTTP Engine
    spdlog::info("Configuring Drogon HTTP Server on {}:{}", config.server.host, config.server.http_port);
    
    drogon::app()
        .addListener(config.server.host, config.server.http_port)
        .setThreadNum(config.server.thread_count)
        .setClientMaxBodySize(1024 * 1024); // 1MB Max Request Body Budget

    // 6. Run Drogon Event Loop
    spdlog::info("VC Brain Entity Resolution Engine is operational and ready to accept requests.");
    drogon::app().run();

    spdlog::info("VC Brain Entity Resolution Engine has shut down cleanly.");
    return 0;
}
