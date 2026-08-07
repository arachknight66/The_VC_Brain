# libs/vcbrain-integration/CMakeLists.txt
# CMake Configuration for VC Brain Phase 4.1 Complete Platform Integration

cmake_minimum_required(VERSION 3.28)
project(vcbrain-integration VERSION 4.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../vcbrain-core/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../vcbrain-platform/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../vcbrain-observability/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../vcbrain-security/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../vcbrain-intelligence/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../../services/svc-entity-resolution-engine/include
)

add_library(vcbrain-integration STATIC
    src/platform_bus.cpp
)

target_link_libraries(vcbrain-integration PUBLIC
    vcbrain-core
    vcbrain-platform
    vcbrain-observability
    vcbrain-security
    vcbrain-intelligence
    entity_resolution_core
    nlohmann_json::nlohmann_json
    spdlog::spdlog
    fmt::fmt
)

enable_testing()

add_executable(platform_e2e_integration_tests
    tests/test_platform_e2e_integration.cpp
)

target_link_libraries(platform_e2e_integration_tests PRIVATE
    vcbrain-integration
    GTest::gtest
    GTest::gtest_main
)

add_test(NAME RunPlatformE2EIntegrationTests COMMAND platform_e2e_integration_tests)
