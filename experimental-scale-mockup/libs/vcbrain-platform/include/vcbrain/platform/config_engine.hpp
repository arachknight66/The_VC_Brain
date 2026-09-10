#ifndef VCBRAIN_PLATFORM_CONFIG_ENGINE_HPP
#define VCBRAIN_PLATFORM_CONFIG_ENGINE_HPP

#include <string>
#include <memory>
#include <yaml-cpp/yaml.h>

namespace vcbrain::platform {

class ConfigEngine {
public:
    static ConfigEngine& instance();

    void load_profile(const std::string& profile_name, const std::string& config_dir = "config");
    [[nodiscard]] std::string get_string(const std::string& key, const std::string& default_val = "") const;
    [[nodiscard]] int get_int(const std::string& key, int default_val = 0) const;
    [[nodiscard]] double get_double(const std::string& key, double default_val = 0.0) const;
    [[nodiscard]] bool get_bool(const std::string& key, bool default_val = false) const;

private:
    ConfigEngine() = default;
    YAML::Node root_node_;
};

} // namespace vcbrain::platform

#endif // VCBRAIN_PLATFORM_CONFIG_ENGINE_HPP
