#include <gtest/gtest.h>
#include "vcbrain/entityresolution/domain/service/blocking_service.hpp"

using namespace vcbrain::entityresolution::domain::service;
using namespace vcbrain::entityresolution::domain::model;

TEST(BlockingDomainServiceTest, ExactDomainHashNormalizesWWWAndCase) {
    BlockingDomainService service;
    
    EXPECT_EQ(service.compute_exact_domain_hash("WWW.AcmeAI.IO"), "acmeai.io");
    EXPECT_EQ(service.compute_exact_domain_hash("acmeai.io"), "acmeai.io");
}

TEST(BlockingDomainServiceTest, PhoneticKeyStripsPunctuationAndUppercases) {
    BlockingDomainService service;
    
    EXPECT_EQ(service.compute_phonetic_name_key("Acme AI, Inc."), "ACMEAIINC");
}

TEST(BlockingDomainServiceTest, Evaluate4PassBlockingDetectsExactDomainMatch) {
    BlockingDomainService service;
    
    std::vector<GoldenRecordAggregate> existing_candidates;
    GoldenRecordAggregate candidate1(UUIDv7::generate(), "Acme Systems", "acmeai.io");
    existing_candidates.push_back(candidate1);

    auto matches = service.evaluate_4pass_blocking("Acme Artificial Intelligence", "acmeai.io", existing_candidates);

    ASSERT_EQ(matches.size(), 1u);
    EXPECT_EQ(matches.front().blocking_pass_source, "PASS_1_EXACT_DOMAIN");
    EXPECT_GE(matches.front().ml_match_probability, 0.95);
}
