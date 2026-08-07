# libs/conanfile.py
# Conan 2.x Package Descriptor for VC Brain Phase 3A Foundation Libraries

from conan import ConanFile
from conan.tools.cmake import CMake, cmake_layout, CMakeToolchain, CMakeDeps

class VcBrainFoundationConan(ConanFile):
    name = "vcbrain-foundation"
    version = "3.0.0"
    package_type = "library"
    
    settings = "os", "compiler", "build_type", "arch"
    
    requires = [
        "drogon/1.9.3",
        "boost/1.84.0",
        "spdlog/1.13.0",
        "fmt/10.2.1",
        "yaml-cpp/0.8.0",
        "nlohmann_json/3.11.3",
        "gtest/1.14.0"
    ]

    def layout(self):
        cmake_layout(self)

    def generate(self):
        tc = CMakeToolchain(self)
        tc.variables["CMAKE_CXX_STANDARD"] = "23"
        tc.generate()
        deps = CMakeDeps(self)
        deps.generate()

    def build(self):
        cmake = CMake(self)
        cmake.configure()
        cmake.build()

    def package(self):
        cmake = CMake(self)
        cmake.install()
