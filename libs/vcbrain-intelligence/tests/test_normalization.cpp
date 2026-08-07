#include <gtest/gtest.h>
#include "vcbrain/intelligence/epic3_normalization/normalization.hpp"

using namespace vcbrain::intelligence::normalization;

TEST(NormalizationEngineTest, NormalizesCompanyNamesAndDomains) {
    EXPECT_EQ(NormalizationEngine::normalize_company_name("Acme AI, Inc."), "Acme AI");
    EXPECT_EQ(NormalizationEngine::normalize_domain("https://www.AcmeAI.io/"), "acmeai.io");
    EXPECT_EQ(NormalizationEngine::normalize_founder_name("DARIO AMODEI"), "Dario Amodei");
}
