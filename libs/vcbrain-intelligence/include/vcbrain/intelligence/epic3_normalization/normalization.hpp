#ifndef VCBRAIN_INTELLIGENCE_NORMALIZATION_HPP
#define VCBRAIN_INTELLIGENCE_NORMALIZATION_HPP

#include <string>

namespace vcbrain::intelligence::normalization {

class NormalizationEngine {
public:
    [[nodiscard]] static std::string normalize_company_name(const std::string& name);
    [[nodiscard]] static std::string normalize_domain(const std::string& domain);
    [[nodiscard]] static std::string normalize_founder_name(const std::string& name);
    [[nodiscard]] static std::string normalize_currency(double amount, const std::string& currency_code);
};

} // namespace vcbrain::intelligence::normalization

#endif // VCBRAIN_INTELLIGENCE_NORMALIZATION_HPP
