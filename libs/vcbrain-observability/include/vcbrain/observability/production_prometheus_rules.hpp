#ifndef VCBRAIN_OBSERVABILITY_PRODUCTION_PROMETHEUS_RULES_HPP
#define VCBRAIN_OBSERVABILITY_PRODUCTION_PROMETHEUS_RULES_HPP

#include <string>
#include <vector>

namespace vcbrain::observability {

struct PrometheusAlertRule {
    std::string name;
    std::string expr;
    std::string duration;
    std::string severity; // critical, warning, info
    std::string summary;
};

class PrometheusRuleEngine {
public:
    [[nodiscard]] static std::vector<PrometheusAlertRule> get_standard_production_alert_rules();
    [[nodiscard]] static std::string generate_yaml_alert_rules();
};

} // namespace vcbrain::observability

#endif // VCBRAIN_OBSERVABILITY_PRODUCTION_PROMETHEUS_RULES_HPP
