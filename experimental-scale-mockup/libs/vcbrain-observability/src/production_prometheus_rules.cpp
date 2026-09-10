#include "vcbrain/observability/production_prometheus_rules.hpp"
#include <sstream>

namespace vcbrain::observability {

std::vector<PrometheusAlertRule> PrometheusRuleEngine::get_standard_production_alert_rules() {
    return {
        PrometheusAlertRule{
            .name = "VCBrainHighP95Latency",
            .expr = "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.060",
            .duration = "2m",
            .severity = "critical",
            .summary = "P95 End-to-End Latency exceeds SLA target of 60ms."
        },
        PrometheusAlertRule{
            .name = "VCBrainHighErrorRate",
            .expr = "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) > 0.005",
            .duration = "1m",
            .severity = "critical",
            .summary = "HTTP 5xx Error Rate exceeds 0.5% threshold."
        },
        PrometheusAlertRule{
            .name = "VCBrainKafkaConsumerLagHigh",
            .expr = "sum(kafka_consumergroup_lag{topic=\"vcbrain.processing.validated\"}) > 10000",
            .duration = "5m",
            .severity = "warning",
            .summary = "Kafka consumer lag exceeds 10,000 pending messages."
        },
        PrometheusAlertRule{
            .name = "VCBrainSPIFFESVIDExpiringSoon",
            .expr = "spiffe_svid_time_to_expiration_seconds < 3600",
            .duration = "5m",
            .severity = "warning",
            .summary = "SPIFFE X.509 SVID certificate expires in less than 1 hour."
        }
    };
}

std::string PrometheusRuleEngine::generate_yaml_alert_rules() {
    auto rules = get_standard_production_alert_rules();
    std::stringstream ss;
    ss << "groups:\n  - name: vcbrain_production_alerts\n    rules:\n";
    for (const auto& r : rules) {
        ss << "      - alert: " << r.name << "\n"
           << "        expr: " << r.expr << "\n"
           << "        for: " << r.duration << "\n"
           << "        labels:\n"
           << "          severity: " << r.severity << "\n"
           << "        annotations:\n"
           << "          summary: \"" << r.summary << "\"\n";
    }
    return ss.str();
}

} // namespace vcbrain::observability
