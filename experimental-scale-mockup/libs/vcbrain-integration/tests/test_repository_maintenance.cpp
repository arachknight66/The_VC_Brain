#include <gtest/gtest.h>
#include "vcbrain/platform/repository_cleaner_engine.hpp"

using namespace vcbrain::platform;

TEST(RepositoryMaintenanceTest, EngineConfirmsPristineGoldMasterState) {
    RepositoryMaintenanceEngine& engine = RepositoryMaintenanceEngine::instance();

    EXPECT_TRUE(engine.verify_repository_consistency());

    auto summary = engine.get_summary();
    EXPECT_TRUE(summary.is_clean);
    EXPECT_EQ(summary.broken_links_found, 0u);
    EXPECT_GE(summary.repository_maturity_score, 99.0);
}

TEST(RepositoryMaintenanceTest, ManifestExportsCompleteMetadataFilesList) {
    auto manifest = RepositoryMaintenanceEngine::instance().export_repository_manifest();

    EXPECT_EQ(manifest["version"], "v2.0.0-GM");
    EXPECT_EQ(manifest["status"], "GOLD_MASTER_PRISTINE");
    EXPECT_GE(manifest["metadata_files"].size(), 5u);
}
