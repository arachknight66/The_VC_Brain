# VC Brain — Phase 3A Production Foundation Libraries (`vcbrain-foundation`)

## Workspace Overview
The **VC Brain Foundation Workspace (`vcbrain-foundation`)** provides the permanent enterprise C++23 platform foundation shared across all microservices.

---

## Foundation Modules

1. **`vcbrain-core`**:
   - `UUIDv7` monotonic timestamp-ordered ID generation.
   - ISO-8601 UTC time utilities.
   - Thread-local `RequestContext` (trace ID, correlation ID, tenant ID, SPIFFE ID).
   - Core exception hierarchy (`Exception`, `ValidationException`, `SecurityException`, `InfrastructureException`) with RFC 7807 problem details serialization.
2. **`vcbrain-platform`**:
   - `ConfigEngine`: `yaml-cpp` configuration profile manager (`local`, `dev`, `staging`, `prod`).
   - `CircuitBreaker`: C++23 thread-safe circuit breaker state machine (`CLOSED`, `OPEN`, `HALF_OPEN`).
   - `RetryRunner`: Exponential backoff with jitter retry execution wrapper.
3. **`vcbrain-observability`**:
   - `LoggingEngine`: `spdlog` structured JSON log formatter.
   - `MetricsRegistry`: Atomic metrics counter & histogram tracker.
   - `HealthChecker`: Unified Liveness, Readiness, and Startup health probe evaluator.
4. **`vcbrain-security`**:
   - `SPIFFEWorkloadValidator`: Cryptographic SPIFFE X.509 SVID workload attestation validator.
   - `AuthMiddleware`: Drogon HTTP authentication filter enforcing JWT OAuth2 tokens and mesh mTLS.

---

## Build & Test Instructions

### Compilation
```bash
conan install . --output-folder=build --build=missing
cmake -B build -DCMAKE_TOOLCHAIN_FILE=build/build/Release/generators/conan_toolchain.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

### Running Foundation Test Suite
```bash
cd build
ctest --output-on-failure
```
