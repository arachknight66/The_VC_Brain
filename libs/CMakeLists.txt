# libs/CMakeLists.txt
# Master Workspace CMake Configuration for VC Brain Phase 3A Foundation Libraries
# Target Runtime: C++23 Native Shared Libraries

cmake_minimum_required(VERSION 3.28)
project(vcbrain-foundation VERSION 3.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Strict Compiler Warnings & Optimization Flags
if(MSVC)
    add_compile_options(/W4 /WX /permissive- /utf-8)
else()
    add_compile_options(-Wall -Wextra -Wpedantic -Werror -Wshadow -Wnon-virtual-dtor -Wconversion)
endif()

# Find Conan Dependencies
find_package(Drogon REQUIRED)
find_package(Boost REQUIRED COMPONENTS system thread)
find_package(spdlog REQUIRED)
find_package(fmt REQUIRED)
find_package(yaml-cpp REQUIRED)
find_package(nlohmann_json REQUIRED)
find_package(GTest REQUIRED)

# Include Directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/vcbrain-core/include
    ${CMAKE_CURRENT_SOURCE_DIR}/vcbrain-platform/include
    ${CMAKE_CURRENT_SOURCE_DIR}/vcbrain-observability/include
    ${CMAKE_CURRENT_SOURCE_DIR}/vcbrain-security/include
)

# 1. vcbrain-core Library
add_library(vcbrain-core STATIC
    vcbrain-core/src/id_generator.cpp
    vcbrain-core/src/time_utils.cpp
    vcbrain-core/src/request_context.cpp
    vcbrain-core/src/error_framework.cpp
)
target_link_libraries(vcbrain-core PUBLIC nlohmann_json::nlohmann_json fmt::fmt)

# 2. vcbrain-platform Library
add_library(vcbrain-platform STATIC
    vcbrain-platform/src/config_engine.cpp
    vcbrain-platform/src/circuit_breaker.cpp
    vcbrain-platform/src/retry_framework.cpp
    vcbrain-platform/src/tenant_engine.cpp
    vcbrain-platform/src/ga_readiness_engine.cpp
)
target_link_libraries(vcbrain-platform PUBLIC vcbrain-core yaml-cpp::yaml-cpp spdlog::spdlog)

# 3. vcbrain-observability Library
add_library(vcbrain-observability STATIC
    vcbrain-observability/src/logging_framework.cpp
    vcbrain-observability/src/metrics_framework.cpp
    vcbrain-observability/src/health_framework.cpp
    vcbrain-observability/src/analyst_workflow_analytics.cpp
)
target_link_libraries(vcbrain-observability PUBLIC vcbrain-core vcbrain-platform spdlog::spdlog fmt::fmt)

# 4. vcbrain-security Library
add_library(vcbrain-security STATIC
    vcbrain-security/src/spiffe_spire.cpp
    vcbrain-security/src/auth_middleware.cpp
)
target_link_libraries(vcbrain-security PUBLIC vcbrain-core vcbrain-observability Drogon::Drogon)

# CTest Automated Foundation Unit Test Suite
enable_testing()

add_executable(foundation_unit_tests
    tests/test_id_generator.cpp
    tests/test_config_engine.cpp
    tests/test_circuit_breaker.cpp
    tests/test_logging_framework.cpp
)

target_link_libraries(foundation_unit_tests PRIVATE
    vcbrain-core
    vcbrain-platform
    vcbrain-observability
    vcbrain-security
    GTest::gtest
    GTest::gtest_main
)

add_test(NAME RunFoundationUnitTests COMMAND foundation_unit_tests)
