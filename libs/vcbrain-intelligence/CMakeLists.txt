# libs/vcbrain-intelligence/CMakeLists.txt
# CMake Configuration for VC Brain Phase 3B Intelligence Platform Library

cmake_minimum_required(VERSION 3.28)
project(vcbrain-intelligence VERSION 3.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../vcbrain-core/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../vcbrain-platform/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../vcbrain-observability/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../vcbrain-security/include
)

add_library(vcbrain-intelligence STATIC
    src/epic1_discovery/discovery.cpp
    src/epic2_crawl/crawl.cpp
    src/epic3_normalization/normalization.cpp
    src/epic5_evidence/evidence.cpp
    src/epic6_graph/graph_sync.cpp
    src/epic7_search/search_indexer.cpp
    src/epic8_vector/vector_retriever.cpp
    src/epic9_scoring/intelligence_scores.cpp
    src/epic10_ai/ai_pipeline.cpp
)

target_link_libraries(vcbrain-intelligence PUBLIC
    vcbrain-core
    vcbrain-platform
    vcbrain-observability
    vcbrain-security
    nlohmann_json::nlohmann_json
    spdlog::spdlog
    fmt::fmt
)

enable_testing()

add_executable(intelligence_unit_tests
    tests/test_discovery.cpp
    tests/test_normalization.cpp
    tests/test_evidence.cpp
    tests/test_graph_sync.cpp
    tests/test_ai_pipeline.cpp
)

target_link_libraries(intelligence_unit_tests PRIVATE
    vcbrain-intelligence
    GTest::gtest
    GTest::gtest_main
)

add_test(NAME RunIntelligenceUnitTests COMMAND intelligence_unit_tests)
