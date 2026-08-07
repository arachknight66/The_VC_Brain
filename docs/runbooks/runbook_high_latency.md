# SRE Incident Runbook: High P95 Latency Breach (`VCBrainHighP95Latency`)

**Alert Name:** `VCBrainHighP95Latency`  
**Severity:** Critical (`P1`)  
**SLA Target:** End-to-End Latency $P95 < 60\text{ms}$  
**Trigger Condition:** P95 latency $> 60\text{ms}$ for $> 2\text{ minutes}$  

---

## 1. Initial Triage (0–5 Minutes)
1. **Acknowledge PagerDuty Alert**: Silence alert escalation.
2. **Inspect Grafana Dashboard**: Open `VC Brain Platform Latency Overview` dashboard.
3. **Identify Degraded Subsystem**:
   - Check `api_gateway_ingress` latency.
   - Check `entity_resolution_match` P95 latency.
   - Check `cypher_traversal_5hop` Neo4j latency.
   - Check Qdrant Vector ANN search P95 latency.

---

## 2. Mitigation Procedures
### Scenario A: High Qdrant / Vector Search Latency
- **Cause**: Un-quantized HNSW index vector traversal overhead.
- **Action**: Verify INT8 quantization status in Qdrant cluster console. Enable `LoadShedder` if CPU $> 85\%$.

### Scenario B: High Database Lock Contention in CockroachDB
- **Cause**: Hotspot range splits on entity merge transactions.
- **Action**: Check CockroachDB Admin UI for transaction restarts. Trigger `cockroach sql` split range command.

---

## 3. Escalation Path
- Primary On-Call SRE $\rightarrow$ Secondary Platform On-Call $\rightarrow$ Chief Platform Architect.
