# SRE Incident Runbook: Security Incident & Prompt Injection Defense (`VCBrainSecurityIncident`)

**Alert Name:** `VCBrainSecurityIncident`  
**Severity:** Critical (`P1`)  

---

## 1. Initial Triage
1. Check `PromptSanitizer` log events for blocked malicious injection attempts.
2. Check `SPIFFEWorkloadValidator` attestation failure rates.
3. Check `OWASPDefenses` SSRF/XSS blocked requests.

---

## 2. Response Actions
1. **Revoke Compromised SPIFFE SVID**: Execute SPIRE server revocation command for flagged workload identity.
2. **Rotate Vault Secrets**: Trigger immediate 1-hour dynamic secret rotation via Vault Agent sidecar.
3. **Block Abusive Client IPs**: Update Kong Edge Gateway rate-limiting ACLs.
