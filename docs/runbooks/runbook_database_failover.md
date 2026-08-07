# SRE Incident Runbook: Database Failover & High Availability (`VCBrainDBFailover`)

**Alert Name:** `VCBrainDBFailover`  
**Severity:** Critical (`P1`)  
**SLA Target:** Zero Data Loss ($\text{RPO} < 1\text{m}$, $\text{RTO} < 15\text{m}$)  

---

## 1. Initial Triage
1. Check CockroachDB Active-Active cluster node status (Target: 6 Nodes).
2. Check Neo4j Causal Cluster leader lease status (Target: 3 Members).
3. Check Redis Enterprise Sentinel quorum status.

---

## 2. Failover Procedures
- **CockroachDB Multi-AZ Failover**: Active-Active Raft consensus automatically elects new range leaders within 3 seconds. No manual intervention required.
- **Neo4j Leader Election**: If Neo4j leader drops, Raft election establishes new write leader within 5 seconds.
- **Redis Sentinel Failover**: Sentinel promotes slave replica to master within 2 seconds.

---

## 3. Post-Failover Verification
- Verify `HealthChecker::evaluate_health()` returns `UP` across all database subsystems.
