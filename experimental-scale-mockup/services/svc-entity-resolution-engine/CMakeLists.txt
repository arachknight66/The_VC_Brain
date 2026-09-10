# CMakeLists.txt
# Master CMake Configuration for svc-entity-resolution-engine
# Target Runtime: C++23 Native ELF Executable

cmake_minimum_required(VERSION 3.28)
project(svc-entity-resolution-engine VERSION 2.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Strict Compiler Flags
if(MSVC)
    add_compile_options(/W4 /WX /permissive- /utf-8)
else()
    add_compile_options(-Wall -Wextra -Wpedantic -Werror -Wshadow -Wnon-virtual-dtor -Wconversion)
endif()

# Find Dependencies (Conan 2.x Integration)
find_package(Drogon REQUIRED)
find_package(Boost REQUIRED COMPONENTS system thread)
find_package(spdlog REQUIRED)
find_package(fmt REQUIRED)
find_package(yaml-cpp REQUIRED)
find_package(nlohmann_json REQUIRED)
find_package(GTest REQUIRED)

# Include Directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Core Service Library (Hexagonal Core)
add_library(entity_resolution_core STATIC
    src/domain/model/golden_record.cpp
    src/domain/service/blocking_service.cpp
    src/domain/service/survivorship_service.cpp
    src/application/service/entity_resolution_application_service.cpp
    src/infrastructure/config/app_config.cpp
    src/web/rest/entity_resolution_controller.cpp
)

target_link_libraries(entity_resolution_core PUBLIC
    Drogon::Drogon
    Boost::system
    spdlog::spdlog
    fmt::fmt
    yaml-cpp::yaml-cpp
    nlohmann_json::nlohmann_json
)

# Main Executable Target
add_executable(svc-entity-resolution-engine
    src/main.cpp
)

target_link_libraries(svc-entity-resolution-engine PRIVATE
    entity_resolution_core
)

# CTest Automated Testing Target
enable_testing()

add_executable(unit_tests
    tests/unit/test_blocking_service.cpp
    tests/unit/test_golden_record.cpp
)

target_link_libraries(unit_tests PRIVATE
    entity_resolution_core
    GTest::gtest
    GTest::gtest_main
)

add_test(NAME RunUnitTests COMMAND unit_tests)
