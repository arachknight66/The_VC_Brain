#include "vcbrain/platform/config_engine.hpp"
#include <spdlog/spdlog.h>
#include <filesystem>

namespace vcbrain::platform {

ConfigEngine& ConfigEngine::instance() {
    static ConfigEngine instance;
    return instance;
}

void ConfigEngine::load_profile(const std::string& profile_name, const std::string& config_dir) {
    std::string filename = config_dir + "/" + profile_name + ".yaml";
    try {
        if (std::filesystem::exists(filename)) {
            root_node_ = YAML::LoadFile(filename);
            spdlog::info("ConfigEngine loaded profile YAML: '{}'", filename);
        } else {
            spdlog::warn("Config file '{}' not found. Using empty configuration.", filename);
        }
    } catch (const std::exception& ex) {
        spdlog::error("Exception loading YAML config '{}': {}", filename, ex.what());
    }
}

std::string ConfigEngine::get_string(const std::string& key, const std::string& default_val) const {
    if (root_node_[key]) return root_node_[key].as<std::string>();
    return default_val;
}

int ConfigEngine::get_int(const std::string& key, int default_val) const {
    if (root_node_[key]) return root_node_[key].as<int>();
    return default_val;
}

double ConfigEngine::get_double(const std::string& key, double default_val) const {
    if (root_node_[key]) return root_node_[key].as<double>();
    return default_val;
}

bool ConfigEngine::get_bool(const std::string& key, bool default_val) const {
    if (root_node_[key]) return root_node_[key].as<bool>();
    return default_val;
}

} // namespace vcbrain::platform
