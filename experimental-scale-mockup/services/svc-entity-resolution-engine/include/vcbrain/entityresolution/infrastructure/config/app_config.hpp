#ifndef VCBRAIN_ENTITYRESOLUTION_INFRASTRUCTURE_CONFIG_APP_CONFIG_HPP
#define VCBRAIN_ENTITYRESOLUTION_INFRASTRUCTURE_CONFIG_APP_CONFIG_HPP

#include <string>
#include <memory>
#include <yaml-cpp/yaml.h>

namespace vcbrain::entityresolution::infrastructure::config {

struct ServerConfig {
    std::string host{"0.0.0.0"};
    uint16_t http_port{8080};
    uint16_t grpc_port{9090};
    uint16_t metrics_port{9091};
    size_t thread_count{8};
};

struct DatabaseConfig {
    std::string cockroach_uri{"postgresql://root@localhost:26257/vcbrain"};
    std::string redis_uri{"tcp://127.0.0.1:6379"};
    std::string qdrant_uri{"http://localhost:6334"};
};

struct AppConfig {
    ServerConfig server;
    DatabaseConfig database;
    double auto_merge_threshold{0.92};
    double steward_queue_threshold{0.70};

    static AppConfig load_from_file(const std::string& filepath);
};

} // namespace vcbrain::entityresolution::infrastructure::config

#endif // VCBRAIN_ENTITYRESOLUTION_INFRASTRUCTURE_CONFIG_APP_CONFIG_HPP
