#include <gtest/gtest.h>
#include "vcbrain/entityresolution/domain/model/golden_record.hpp"

using namespace vcbrain::entityresolution::domain::model;

TEST(GoldenRecordAggregateTest, InitializesWithUUIDv7AndDefaultState) {
    UUIDv7 id = UUIDv7::generate();
    GoldenRecordAggregate record(id, "Cognitive Infra AI", "cognitiveinfra.ai", 1.0);

    EXPECT_EQ(record.get_entity_id().value, id.value);
    EXPECT_EQ(record.get_canonical_name(), "Cognitive Infra AI");
    EXPECT_EQ(record.get_primary_domain(), "cognitiveinfra.ai");
    EXPECT_EQ(record.get_state(), EntityState::UNRESOLVED);
    EXPECT_EQ(record.get_version(), 1u);
}

TEST(GoldenRecordAggregateTest, StateTransitionsIncrementVersion) {
    GoldenRecordAggregate record(UUIDv7::generate(), "HyperScale Labs", "hyperscale.io");
    
    record.transition_to(EntityState::AUTO_MERGED);
    EXPECT_EQ(record.get_state(), EntityState::AUTO_MERGED);
    EXPECT_EQ(record.get_version(), 2u);

    record.split("Evidence mismatch");
    EXPECT_EQ(record.get_state(), EntityState::ENTITY_SPLIT);
    EXPECT_EQ(record.get_version(), 3u);
}
