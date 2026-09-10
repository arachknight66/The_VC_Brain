#include <gtest/gtest.h>
#include "vcbrain/intelligence/epic5_evidence/evidence.hpp"

using namespace vcbrain::intelligence::evidence;

TEST(EvidenceRegistryTest, RegistersAndVerifiesEvidenceIntegrity) {
    EvidenceRegistry registry;
    std::string rcpt_id = registry.register_evidence("ent_123", "canonical_name", "Cognitive AI", "https://sec.gov", 1.0);

    EXPECT_FALSE(rcpt_id.empty());
    EXPECT_TRUE(registry.verify_integrity(rcpt_id));

    auto receipts = registry.get_evidence_for_entity("ent_123");
    ASSERT_EQ(receipts.size(), 1u);
    EXPECT_EQ(receipts.front().claim_value, "Cognitive AI");
}
