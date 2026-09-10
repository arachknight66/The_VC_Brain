# deploy/Dockerfile
# Multi-Stage C++23 Production Dockerfile for VC Brain Microservices & Libraries
# Base Image: Google Distroless (cc-debian12) for minimal attack surface

# Stage 1: Build Environment
FROM debian:bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++-14 \
    cmake \
    ninja-build \
    make \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV CXX=g++-14
WORKDIR /workspace

COPY . .

RUN cmake -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_STANDARD=23
RUN cmake --build build --config Release -j$(nproc)

# Stage 2: Production Distroless Runtime Image
FROM gcr.io/distroless/cc-debian12:nonroot

LABEL org.opencontainers.image.title="VC Brain Microservice Runtime" \
      org.opencontainers.image.description="VC Brain Enterprise C++23 Distributed Runtime" \
      org.opencontainers.image.version="1.0.0-RELEASE" \
      org.opencontainers.image.authors="VC Brain Engineering Team" \
      org.opencontainers.image.licenses="Proprietary"

WORKDIR /app

COPY --from=builder --chown=nonroot:nonroot /workspace/build/services/svc-entity-resolution-engine/svc-entity-resolution-engine /app/svc-entity-resolution-engine

USER nonroot:nonroot

EXPOSE 8080 9090

ENTRYPOINT ["/app/svc-entity-resolution-engine"]
