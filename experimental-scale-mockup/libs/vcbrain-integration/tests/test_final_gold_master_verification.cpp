#include <gtest/gtest.h>
#include "vcbrain/platform/final_gold_master_verification.hpp"

using namespace vcbrain::platform;

TEST(FinalGoldMasterVerificationTest, CertifierConfirms100PercentDomainSignoffs) {
    FinalReleaseCertifier& certifier = FinalReleaseCertifier::instance();

    EXPECT_TRUE(certifier.execute_final_release_verification());

    auto cert = certifier.get_certificate();
    EXPECT_EQ(cert.release_tag, "v2.0.0-GM");
    EXPECT_TRUE(cert.repository_frozen);
    EXPECT_TRUE(cert.engineering_signoff);
    EXPECT_TRUE(cert.qa_signoff);
    EXPECT_TRUE(cert.security_signoff);
    EXPECT_TRUE(cert.operations_signoff);
    EXPECT_TRUE(cert.documentation_signoff);
    EXPECT_TRUE(cert.architecture_signoff);
    EXPECT_TRUE(cert.executive_signoff);
    EXPECT_DOUBLE_EQ(cert.overall_gold_master_score, 100.0);
}

TEST(FinalGoldMasterVerificationTest, CertificateExportsValidSHA256Digest) {
    auto cert_json = FinalReleaseCertifier::instance().generate_official_certificate_json();

    EXPECT_EQ(cert_json["release_tag"], "v2.0.0-GM");
    EXPECT_EQ(cert_json["status"], "PERMANENTLY_FROZEN_GOLD_MASTER");
    EXPECT_FALSE(cert_json["sha256_repository_digest"].get<std::string>().empty());
    EXPECT_EQ(cert_json["domain_signoffs"]["executive"], true);
}
