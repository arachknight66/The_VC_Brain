#ifndef VCBRAIN_INTELLIGENCE_AI_PIPELINE_HPP
#define VCBRAIN_INTELLIGENCE_AI_PIPELINE_HPP

#include <string>
#include <vector>

namespace vcbrain::intelligence::ai {

struct RAGContext {
    std::string company_id;
    std::string canonical_name;
    std::vector<std::string> evidence_receipt_ids;
    std::vector<std::string> retrieved_snippets;
};

struct IntelligenceInsight {
    std::string insight_id;
    std::string executive_summary;
    std::string reasoning_chain;
    std::vector<std::string> citations;
    double confidence_score{0.92};
};

class AIIntelligencePipeline {
public:
    AIIntelligencePipeline() = default;

    [[nodiscard]] RAGContext assemble_rag_context(
        const std::string& company_id,
        const std::vector<std::string>& evidence_ids,
        const std::vector<std::string>& snippets
    ) const;

    [[nodiscard]] IntelligenceInsight generate_explainable_insight(const RAGContext& context) const;
};

} // namespace vcbrain::intelligence::ai

#endif // VCBRAIN_INTELLIGENCE_AI_PIPELINE_HPP
