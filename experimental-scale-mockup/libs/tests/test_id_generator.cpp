#include <gtest/gtest.h>
#include "vcbrain/core/id_generator.hpp"

using namespace vcbrain::core;

TEST(IDGeneratorTest, GeneratesValidUUIDv7String) {
    std::string uuid = IDGenerator::new_uuidv7_string();
    EXPECT_FALSE(uuid.empty());
    EXPECT_EQ(uuid.length(), 36u);
    EXPECT_EQ(uuid[8], '-');
    EXPECT_EQ(uuid[13], '-');
    EXPECT_EQ(uuid[18], '-');
    EXPECT_EQ(uuid[23], '-');
}

TEST(IDGeneratorTest, GeneratesSequentialMonotonicUUIDs) {
    UUIDv7 id1 = IDGenerator::new_uuidv7();
    UUIDv7 id2 = IDGenerator::new_uuidv7();
    
    EXPECT_NE(id1.value, id2.value);
}
