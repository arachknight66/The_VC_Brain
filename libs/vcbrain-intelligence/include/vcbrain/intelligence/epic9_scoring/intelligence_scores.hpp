#ifndef VCBRAIN_INTELLIGENCE_SCORES_HPP
#define VCBRAIN_INTELLIGENCE_SCORES_HPP

#include <string>

namespace vcbrain::intelligence::scoring {

struct IntelligenceProfile {
    std::string company_id;
    double founder_score{0.0};
    double product_market_fit_score{0.0};
    double technology_defensibility_score{0.0};
    double market_traction_score{0.0};
    double composite_investment_score{0.0};
};

class IntelligenceCalculator {
public:
    [[nodiscard]] static IntelligenceProfile compute_profile(
        const std::string& company_id,
        double github_velocity,
        double founder_pedigree_authority,
        double patent_count
    );
};

} // namespace vcbrain::intelligence::scoring

#endif // VCBRAIN_INTELLIGENCE_SCORES_HPP
