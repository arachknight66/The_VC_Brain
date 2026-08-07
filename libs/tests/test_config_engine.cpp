#include <gtest/gtest.h>
#include "vcbrain/platform/config_engine.hpp"

using namespace vcbrain::platform;

TEST(ConfigEngineTest, HandlesMissingFileWithDefaults) {
    ConfigEngine& config = ConfigEngine::instance();
    config.load_profile("non_existent_profile");

    EXPECT_EQ(config.get_string("server.host", "127.0.0.1"), "127.0.0.1");
    EXPECT_EQ(config.get_int("server.port", 8080), 8080);
    EXPECT_TRUE(config.get_bool("enabled", true));
}
