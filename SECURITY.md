# VC Brain Enterprise Security Policy

## Security Architecture & Workload Protection

VC Brain implements defense-in-depth enterprise security across all system layers:

1. **Zero Trust Workload Attestation**: SPIFFE/SPIRE mTLS identity validation (`spiffe://vcbrain.internal/...`).
2. **Strict Tenant Isolation**: CockroachDB Row-Level Security (RLS), Neo4j Tenant Labels, Qdrant Payload Filters, Elasticsearch Tenant Index Prefixes.
3. **Data Encryption**: TLS 1.3 in transit, AES-256 GCM at rest, S3 WORM Object Lock for immutable SHA-256 evidence receipts.
4. **OWASP Web Security**: Integrated `PromptSanitizer`, `LoadShedder`, `Bulkhead` concurrency pools, and SSRF/XSS/SQLi defenses.

## Reporting Security Vulnerabilities

Please report potential security issues directly to security@vcbrain.internal.
All valid reports receive acknowledgment within 24 hours.
