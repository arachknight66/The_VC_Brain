# VC Brain — Phase 3B Venture Intelligence Platform Library (`vcbrain-intelligence`)

## Workspace Overview
The **Venture Intelligence Platform Library (`vcbrain-intelligence`)** implements the 10 core intelligence epics of VC Brain in modern C++23.

---

## 10 Implementation Epics

1. **EPIC 1 — Discovery Platform** (`epic1_discovery`): Multi-provider discovery sweeps (Exa, Tavily, SerpAPI, GitHub, OpenAlex, SEC EDGAR) with provider health tracking & cost accounting.
2. **EPIC 2 — Crawl Platform** (`epic2_crawl`): Distributed URL Frontier, Playwright headless snapshot pool, and markdown extraction.
3. **EPIC 3 — Normalization Platform** (`epic3_normalization`): Field normalizers for Company Names, Founder Names, Domains, Addresses, Currencies, and Dates.
4. **EPIC 4 — Entity Resolution Platform** (`epic4_er`): Integration with `svc-entity-resolution-engine` candidate blocking and survivorship.
5. **EPIC 5 — Evidence Platform** (`epic5_evidence`): Immutable SHA-256 evidence hashing, audit receipts, and citation engines.
6. **EPIC 6 — Knowledge Graph Platform** (`epic6_graph`): Neo4j Property Graph synchronization, Cypher generation, and founder influence scoring.
7. **EPIC 7 — Search Platform** (`epic7_search`): Elasticsearch BM25 + Vector hybrid search & relevance ranking.
8. **EPIC 8 — Vector Intelligence Platform** (`epic8_vector`): Qdrant 1536-dim vector embedding generator & HNSW ANN nearest neighbor retriever.
9. **EPIC 9 — Intelligence Engine** (`epic9_scoring`): Multi-dimensional investment intelligence scoring (Founder, Tech, PMF, Traction).
10. **EPIC 10 — AI Intelligence Platform** (`epic10_ai`): RAG Context Assembly, Multi-Hop Reasoning, zero-hallucination fact verification, and explainable citations.

---

## Build & Test Instructions

```bash
cd libs/vcbrain-intelligence
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
cd build && ctest --output-on-failure
```
