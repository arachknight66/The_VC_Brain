# VC Brain — Entity Resolution Engine (`svc-entity-resolution-engine`)

## Service Overview
The **Entity Resolution Engine (`svc-entity-resolution-engine`)** is the canonical Master Data Management (MDM) microservice in VC Brain. Written in modern **C++23** using the **Drogon Framework** and **Boost.Asio**, it resolves billions of noisy, fragmented internet observations into verified, canonical Golden Master Records.

---

## Technical Architecture & Technology Stack
- **Language Standard**: Modern C++23 (`-std=c++23`, GCC 14+ / Clang 18+)
- **HTTP / Web Engine**: Drogon Framework 1.9+ (`drogon::HttpController`)
- **Async Execution**: C++20 Coroutines + Boost.Asio 1.84+ Multi-Threaded Thread Pools
- **Build System**: CMake 3.28+ & Conan 2.x Package Manager
- **Logging & JSON**: `spdlog` 1.13+, `fmt` 10.2+, `nlohmann/json` 3.11+
- **Testing Engine**: GoogleTest (gtest) & GoogleMock (gmock) 1.14+
- **Architecture**: Hexagonal Ports & Adapters in `namespace vcbrain::entityresolution`

---

## Directory Structure
```
svc-entity-resolution-engine
├── CMakeLists.txt              # Master CMake Build File (CMake 3.28+)
├── conanfile.py                # Conan 2.x Package Descriptor
├── include/vcbrain/entityresolution
│   ├── domain                  # Pure C++23 Domain Aggregates & Services
│   ├── application             # Abstract Ports & Application Services
│   ├── infrastructure          # Config, Adapters, Security
│   └── web                     # Drogon REST HTTP Controllers
├── src                         # C++ Implementation Files (.cpp)
└── tests/unit                  # GoogleTest Unit Testing Suite
```

---

## Build & Test Instructions

### Prerequisites
- CMake 3.28 or higher
- GCC 14+ or Clang 18+ supporting C++23
- Conan 2.x Package Manager

### Building Native ELF Binary
```bash
# 1. Install dependencies via Conan 2.x
conan install . --output-folder=build --build=missing

# 2. Configure CMake
cmake -B build -DCMAKE_TOOLCHAIN_FILE=build/build/Release/generators/conan_toolchain.cmake -DCMAKE_BUILD_TYPE=Release

# 3. Compile Native ELF Binary
cmake --build build --config Release
```

### Running Unit Tests
```bash
cd build
ctest --output-on-failure
```
