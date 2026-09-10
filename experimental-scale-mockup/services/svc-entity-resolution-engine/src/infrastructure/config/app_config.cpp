#include "vcbrain/entityresolution/infrastructure/config/app_config.hpp"
#include <spdlog/spdlog.h>
#include <fstream>

namespace vcbrain::entityresolution::infrastructure::config {

AppConfig AppConfig::load_from_file(const std::string& filepath) {
    AppConfig config;
    try {
        YAML::Node yaml = YAML::LoadFile(filepath);
        
        if (yaml["server"]) {
            if (yaml["server"]["host"]) config.server.host = yaml["server"]["host"].as<std::string>();
            if (yaml["server"]["http_port"]) config.server.http_port = yaml["server"]["http_port"].as<uint16_t>();
            if (yaml["server"]["grpc_port"]) config.server.grpc_port = yaml["server"]["grpc_port"].as<uint16_t>();
            if (yaml["server"]["thread_count"]) config.server.thread_count = yaml["server"]["thread_count"].as<size_t>();
        }

        if (yaml["database"]) {
            if (yaml["database"]["cockroach_uri"]) config.database.cockroach_uri = yaml["database"]["cockroach_uri"].as<std::string>();
            if (yaml["database"]["redis_uri"]) config.database.redis_uri = yaml["database"]["redis_uri"].as<std::string>();
            if (yaml["database"]["qdrant_uri"]) config.database.qdrant_uri = yaml["database"]["qdrant_uri"].as<std::string>();
        }

        if (yaml["thresholds"]) {
            if (yaml["thresholds"]["auto_merge"]) config.auto_merge_threshold = yaml["thresholds"]["auto_merge"].as<double>();
            if (yaml["thresholds"]["steward_queue"]) config.steward_queue_threshold = yaml["thresholds"]["steward_queue"].as<double>();
        }

        spdlog::info("Successfully loaded application config from {}", filepath);
    } catch (const std::exception& ex) {
        spdlog::warn("Failed to load config file '{}': {}. Using default configuration.", filepath, ex.what());
    }

    return config;
}

} // namespace vcbrain::entityresolution::infrastructure::config
