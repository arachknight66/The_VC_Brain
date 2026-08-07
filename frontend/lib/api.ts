import type { DashboardSummary, FounderRecord, InvestorBriefing, Signal } from "./types";

const API = "/api/vc";

async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

/* ── Dashboard ── */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return fetcher<DashboardSummary>(`${API}/dashboard/summary`);
}

/* ── Founders ── */
export async function fetchFounders(): Promise<FounderRecord[]> {
  return fetcher<FounderRecord[]>(`${API}/founders`);
}

export async function fetchFounder(id: string): Promise<FounderRecord> {
  return fetcher<FounderRecord>(`${API}/founders/${id}`);
}

export async function fetchFounderMemo(id: string): Promise<{ memo: Record<string, unknown>; adversarial_view: Record<string, unknown> }> {
  return fetcher(`${API}/founders/${id}/memo`);
}

export async function fetchFounderBuildEvidence(id: string) {
  return fetcher(`${API}/founders/${id}/build-evidence`);
}

export async function fetchFounderBriefing(id: string): Promise<InvestorBriefing> {
  return fetcher<InvestorBriefing>(`${API}/founders/${id}/investor-briefing`);
}

export async function sendChat(founderId: string, message: string, briefingSteps: { label: string; content: string; elapsed?: number }[] = []): Promise<{ reply: string }> {
  return fetcher(`${API}/founders/${founderId}/chat`, {
    method: "POST",
    body: JSON.stringify({ message, briefing_steps: briefingSteps }),
  });
}

/* ── Signals ── */
export async function fetchSignals(source?: string, limit = 100): Promise<{ signals: Signal[]; counts: Record<string, number> }> {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  params.set("limit", String(limit));
  return fetcher(`${API}/signals?${params}`);
}

/* ── Scanners ── */
export async function fetchScannerSources(): Promise<{ sources: string[] }> {
  return fetcher(`${API}/scanners/sources`);
}

export async function runScanner(query: string, sources: string[] = [], maxResults = 10, persist = true) {
  return fetcher(`${API}/scanners/run`, {
    method: "POST",
    body: JSON.stringify({ query, sources, max_results: maxResults, persist }),
  });
}

/* ── Workspace ── */
export async function fetchWorkspace() {
  return fetcher<{ organization: { id: string; name: string }; user: { email: string; displayName: string; role: string }; workspace: Record<string, unknown>; version: number; updatedAt: string | null }>("/api/workspace");
}

export async function saveWorkspace(workspace: Record<string, unknown>, expectedVersion: number, action?: string) {
  return fetcher<{ workspace: Record<string, unknown>; version: number; updatedAt: string }>("/api/workspace", {
    method: "PUT",
    body: JSON.stringify({ workspace, expectedVersion, action }),
  });
}

/* ── System ── */
export async function fetchHealthCheck() {
  return fetcher<{ status: string }>(`${API}/health`);
}
