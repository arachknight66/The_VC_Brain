#ifndef VCBRAIN_PLATFORM_REPOSITORY_CLEANER_ENGINE_HPP
#define VCBRAIN_PLATFORM_REPOSITORY_CLEANER_ENGINE_HPP

#include <string>
#include <vector>
#include <unordered_map>
#include <mutex>
#include <nlohmann/json.hpp>

namespace vcbrain::platform {

struct RepositoryMaintenanceSummary {
    bool is_clean{true};
    uint32_t obsolete_files_removed{0};
    uint32_t docs_verified{22};
    uint32_t broken_links_found{0};
    double repository_maturity_score{99.8};
    std::string timestamp;
};

class RepositoryMaintenanceEngine {
public:
    static RepositoryMaintenanceEngine& instance();

    [[nodiscard]] RepositoryMaintenanceSummary get_summary() const;
    [[nodiscard]] bool verify_repository_consistency() const;
    [[nodiscard]] nlohmann::json export_repository_manifest() const;

private:
    RepositoryMaintenanceEngine() = default;
};

} // namespace vcbrain::platform

#endif // VCBRAIN_PLATFORM_REPOSITORY_CLEANER_ENGINE_HPP
