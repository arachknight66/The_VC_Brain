#include "vcbrain/intelligence/epic9_scoring/intelligence_scores.hpp"

namespace vcbrain::intelligence::scoring {

IntelligenceProfile IntelligenceCalculator::compute_profile(
    const std::string& company_id,
    double github_velocity,
    double founder_pedigree_authority,
    double patent_count
) {
    double founder = std::min(1.0, founder_pedigree_authority * 0.90);
    double tech = std::min(1.0, (github_velocity * 0.40) + (patent_count * 0.15));
    double pmf = std::min(1.0, github_velocity * 0.50 + 0.30);
    double traction = std::min(1.0, (pmf + tech) / 2.0);

    double composite = (founder * 0.30) + (tech * 0.30) + (pmf * 0.25) + (traction * 0.15);

    return IntelligenceProfile{
        .company_id = company_id,
        .founder_score = founder,
        .product_market_fit_score = pmf,
        .technology_defensibility_score = tech,
        .market_traction_score = traction,
        .composite_investment_score = composite
    };
}

} // namespace vcbrain::intelligence::scoring
