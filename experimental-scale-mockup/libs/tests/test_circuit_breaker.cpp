#include <gtest/gtest.h>
#include "vcbrain/platform/circuit_breaker.hpp"

using namespace vcbrain::platform;

TEST(CircuitBreakerTest, StartsInClosedStateAndTripsToOpen) {
    CircuitBreaker breaker("test_service", 2, std::chrono::milliseconds(100));

    EXPECT_EQ(breaker.state(), CircuitState::CLOSED);
    EXPECT_TRUE(breaker.allow_request());

    breaker.record_failure();
    EXPECT_EQ(breaker.state(), CircuitState::CLOSED);

    breaker.record_failure(); // Threshold reached
    EXPECT_EQ(breaker.state(), CircuitState::OPEN);
    EXPECT_FALSE(breaker.allow_request());
}

TEST(CircuitBreakerTest, TransitionsToHalfOpenAfterRecoveryTimeout) {
    CircuitBreaker breaker("test_service", 1, std::chrono::milliseconds(10));
    breaker.record_failure();

    EXPECT_EQ(breaker.state(), CircuitState::OPEN);

    std::this_thread::sleep_for(std::chrono::milliseconds(15));

    EXPECT_TRUE(breaker.allow_request()); // Resets to HALF_OPEN
    EXPECT_EQ(breaker.state(), CircuitState::HALF_OPEN);

    breaker.record_success();
    EXPECT_EQ(breaker.state(), CircuitState::CLOSED);
}
