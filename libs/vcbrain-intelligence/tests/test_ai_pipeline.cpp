#include <gtest/gtest.h>
#include "vcbrain/intelligence/epic10_ai/ai_pipeline.hpp"

using namespace vcbrain::intelligence::ai;

TEST(AIIntelligencePipelineTest, AssemblesContextAndGeneratesExplainableInsight) {
    AIIntelligencePipeline pipeline;
    auto ctx = pipeline.assemble_rag_context("comp_456", {"rcpt_1", "rcpt_2"}, {"Snippet 1 text", "Snippet 2 text"});

    EXPECT_EQ(ctx.company_id, "comp_456");
    EXPECT_EQ(ctx.retrieved_snippets.size(), 2u);

    auto insight = pipeline.generate_explainable_insight(ctx);
    EXPECT_FALSE(insight.insight_id.empty());
    EXPECT_GE(insight.confidence_score, 0.90);
    EXPECT_EQ(insight.citations.size(), 2u);
}
