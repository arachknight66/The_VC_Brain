"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Columns3,
  Download,
  FileCheck2,
  FileText,
  Filter,
  Globe2,
  Inbox,
  Key,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Menu,
  MessageSquare,
  Moon,
  PieChart,
  Plus,
  Radar,
  RefreshCw,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Upload,
  UserCheck,
  UserRound,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AppUser } from "./app-auth";

type View =
  | "overview"
  | "company"
  | "founder"
  | "pipeline"
  | "market"
  | "graph"
  | "search"
  | "watchlists"
  | "reports"
  | "copilot"
  | "admin"
  | "discovery"
  | "mdm"
  | "evidence"
  | "metrics"
  | "inbox"
  | "diligence"
  | "compare"
  | "memo"
  | "ic"
  | "portfolio"
  | "research"
  | "lab"
  | "intake";

type PipelineStage = "New" | "Qualified" | "Partner review" | "Diligence" | "IC" | "Invest" | "Pass";
type ClaimReviewStatus = "unreviewed" | "approved" | "disputed" | "evidence_requested";

type Signal = {
  signal_id: string;
  source: string;
  title: string;
  source_url: string;
  summary: string;
  query?: string;
  score: number;
  observed_at: string;
  external_id?: string;
  raw_payload?: Record<string, unknown>;
  status?: string;
};

type TrustClaim = {
  claim_text: string;
  confidence: number;
  evidence_category: "known_verified" | "statistical_association" | "unverifiable";
  source: string | null;
  contradiction_flag: boolean;
};

type FounderRecord = {
  founder_id: string;
  name: string;
  company_name: string;
  source_channel: string;
  screened_out: boolean;
  screened_out_reason: string | null;
  entity_resolution_confidence: number | null;
  raw_inputs: Record<string, string | boolean | null | string[]>;
  founder_score: { value: number; trend: "improving" | "stable" | "declining"; confidence: number; confidence_basis: string | null; history: Array<{ timestamp: string; value: number; context: string }> };
  axis_scores: Record<string, { rating: string; score: number; trend: string; rationale: string }>;
  build_evidence: { tier: string; signals_checked: string[]; evidence_log: Array<{ signal: string; found: boolean; detail: string; source_url: string | null }> };
  trust_claims: TrustClaim[];
  source_evidence: Array<{ source: string; title: string; url: string; content?: string; collected_at?: string; confidence: number }>;
  memo: Record<string, unknown>;
  adversarial_view: Record<string, unknown>;
  timing: { elapsed_seconds: number | null; memo_ready_at: string | null; stage_timings: Record<string, number> };
};

type DashboardSummary = {
  founder_records: number;
  active_opportunities: number;
  raw_signals: number;
  memo_ready: number;
  high_confidence_scores: number;
  verified_builds: number;
  verified_claims: number;
  unverified_claims: number;
  average_founder_score: number;
  average_score_confidence: number;
  average_signal_to_memo_seconds: number | null;
};

type BriefingStep = { label: string; content: string; elapsed: number };
type ChatMessage = { id: string; role: "assistant" | "user" | "thinking"; label?: string; content: string };
type CompanyWorkflow = { stage: PipelineStage; owner: string; decision: string; updatedAt: string };
type Toast = { id: string; message: string; tone: "success" | "info" | "warning" };
type SessionUser = AppUser & { role?: "admin" | "member" | "viewer"; organizationName?: string };
type SyncStatus = "loading" | "saved" | "saving" | "conflict" | "error";
type ThemeMode = "light" | "dark";
type HealthPayload = { status: string; version?: string; timestamp?: string; subsystems?: Record<string, { status: string; provider?: string; latency_p95_ms?: number; nodes?: number }> };
type DiscoveryPayload = { candidates?: Array<{ candidate_id: string; name: string; primary_domain: string; priority_score: number; sources: string[]; evidence_receipt_id?: string }>; count?: number };
type GraphPayload = { nodes?: Array<{ id: string; labels: string[]; properties: Record<string, unknown> }>; edges?: Array<{ edge_id: string; source_id: string; target_id: string; type: string; weight: number }> };

const API_BASE = "/api/vc";
const EMPTY_SUMMARY: DashboardSummary = { founder_records: 0, active_opportunities: 0, raw_signals: 0, memo_ready: 0, high_confidence_scores: 0, verified_builds: 0, verified_claims: 0, unverified_claims: 0, average_founder_score: 0, average_score_confidence: 0, average_signal_to_memo_seconds: null };
const OWNERS = ["Arjun Kapoor", "Maya Chen", "Noah Williams", "Unassigned"];
const PIPELINE_STAGES: PipelineStage[] = ["New", "Qualified", "Partner review", "Diligence", "IC", "Invest", "Pass"];

const navItems = [
  { id: "overview" as View, label: "Executive Dashboard", icon: LayoutDashboard },
  { id: "company" as View, label: "Company Intelligence", icon: Building2 },
  { id: "founder" as View, label: "Founder Intelligence", icon: UserCheck },
  { id: "pipeline" as View, label: "Deal Flow Workspace", icon: Columns3 },
  { id: "market" as View, label: "Market Intelligence", icon: PieChart },
  { id: "graph" as View, label: "Knowledge Graph", icon: Globe2 },
  { id: "search" as View, label: "Semantic Search", icon: Search },
  { id: "watchlists" as View, label: "Watchlists & Alerts", icon: BellRing },
  { id: "reports" as View, label: "Reports & Memos", icon: FileText },
  { id: "copilot" as View, label: "AI Copilot", icon: Bot },
  { id: "admin" as View, label: "Administration", icon: Settings },
  { id: "discovery" as View, label: "Discovery Radar", icon: Radar },
  { id: "mdm" as View, label: "Entity Disambiguation", icon: Target },
  { id: "evidence" as View, label: "Evidence Receipts", icon: FileCheck2 },
  { id: "metrics" as View, label: "System Health", icon: Activity },
];

const viewTitles: Record<View, string> = {
  overview: "Executive Dashboard & Portfolio KPIs",
  company: "Company Intelligence & Technology Stack",
  founder: "Founder Intelligence & Pedigree Graph",
  pipeline: "Deal Flow Workspace & Stage Management",
  market: "Market Intelligence & Sector Heatmaps",
  graph: "Enterprise Knowledge Graph Explorer (Neo4j)",
  search: "Semantic Search (Hybrid BM25 + Qdrant 1536-dim Vector)",
  watchlists: "Watchlists & Custom SLA Alerts",
  reports: "Reports, Memos & Evidence Appendix",
  copilot: "AI Copilot & Multi-hop Reasoning Engine",
  admin: "Platform Administration, RBAC & Cost Accounting",
  discovery: "Discovery Radar (Exa, SerpAPI, GitHub, SEC EDGAR)",
  mdm: "Entity Resolution & MDM Engine",
  evidence: "Evidence Receipts Audit Trail (SHA-256 WORM)",
  metrics: "System Health & OpenTelemetry Telemetry",
  inbox: "Research Inbox",
  diligence: "Diligence",
  compare: "Company Comparison",
  memo: "Investment Memo",
  ic: "Investment Committee",
  portfolio: "Portfolio",
  research: "Research Library",
  lab: "Decision Lab",
  intake: "Pitch Intake",
};

function labelize(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Not available";
}

function formatDate(value: string | null | undefined, fallback = "Unavailable") {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function initials(value: string) {
  return value.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "VC";
}

function getDecision(founder: FounderRecord) {
  const unresolved = founder.trust_claims.filter((claim) => claim.evidence_category !== "known_verified" || claim.contradiction_flag);
  if (founder.screened_out) return { label: "Pass", tone: "negative", confidence: "High", reason: founder.screened_out_reason || "Outside thesis" };
  if (!founder.source_evidence.length || !founder.trust_claims.length) return { label: "Hold", tone: "negative", confidence: "Low", reason: "Evidence incomplete" };
  if (unresolved.length || founder.founder_score.confidence < 0.75) return { label: "Continue diligence", tone: "warning", confidence: "Medium", reason: `${unresolved.length} unresolved claims` };
  return { label: "Advance", tone: "positive", confidence: "High", reason: "Evidence gate satisfied" };
}

export default function VCWorkspace({ currentUser, user: propUser }: { currentUser?: SessionUser; user?: SessionUser }) {
  const user = currentUser || propUser || { id: "user_default", email: "partner@vcbrain.ai", displayName: "Partner" };
  const [view, setView] = useState<View>("overview");
  const [founders, setFounders] = useState<FounderRecord[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [selectedFounderId, setSelectedFounderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCopilotQuery, setActiveCopilotQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", role: "assistant", content: "Welcome to VC Brain AI Copilot. Ask any evidence-backed investment thesis or founder question." }
  ]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryPayload | null>(null);
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${API_BASE}/dashboard/summary`).then(res => { if (!res.ok) throw new Error("summary"); return res.json(); }),
      fetch(`${API_BASE}/founders`).then(res => { if (!res.ok) throw new Error("founders"); return res.json(); }),
      fetch(`${API_BASE}/signals`).then(res => { if (!res.ok) throw new Error("signals"); return res.json(); }),
    ]).then(([nextSummary, founderData, signalData]) => {
      if (cancelled) return;
      const records = Array.isArray(founderData) ? founderData : Array.isArray(founderData?.founders) ? founderData.founders : Array.isArray(founderData?.records) ? founderData.records : [];
      setSummary(nextSummary);
      setFounders(records);
      setSignals(signalData.signals || []);
      if (records.length > 0 && !selectedFounderId) setSelectedFounderId(records[0].founder_id);
    }).catch(() => { if (!cancelled) setDataError("Unable to load VC Brain intelligence. Retry the workspace to reconnect to the research services."); }).finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/v1/system/health`).then(res => res.ok ? res.json() : null),
      fetch(`${API_BASE}/v1/discovery/candidates`).then(res => res.ok ? res.json() : null),
      Promise.all([
        fetch(`${API_BASE}/v1/graph/nodes`).then(res => res.ok ? res.json() : null),
        fetch(`${API_BASE}/v1/graph/edges`).then(res => res.ok ? res.json() : null),
      ]).then(([nodes, edges]) => ({ ...(nodes || {}), ...(edges || {}) })),
    ]).then(([nextHealth, nextDiscovery, nextGraph]) => { setHealth(nextHealth); setDiscovery(nextDiscovery); setGraph(nextGraph); }).catch(() => undefined);
  }, []);

  const activeFounder = founders.find(f => f.founder_id === selectedFounderId) || founders[0] || null;

  async function askCopilot() {
    const question = activeCopilotQuery.trim();
    if (!question || copilotLoading) return;
    if (!activeFounder) { setCopilotError("Select a founder or company before asking a grounded question."); return; }
    setCopilotError(null); setCopilotLoading(true);
    setChatMessages(messages => [...messages, { id: String(Date.now()), role: "user", content: question }]);
    try {
      const response = await fetch(`${API_BASE}/founders/${activeFounder.founder_id}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      if (!response.ok) throw new Error("chat");
      const result = await response.json();
      setChatMessages(messages => [...messages, { id: String(Date.now() + 1), role: "assistant", content: result.answer || result.response || result.message || "No grounded answer was returned." }]);
      setActiveCopilotQuery("");
    } catch { setCopilotError("VC Brain couldn't complete this analysis. Check the selected record and retry."); }
    finally { setCopilotLoading(false); }
  }

  return (
    <div className={`app-shell ${theme}`}>
      {/* Mobile Sidebar Scrim */}
      {sidebarOpen && (
        <div className="scrim" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="logo">
            <span className="logo-mark"><span /><span /><span /><span /></span>
            <span><strong>VC Brain</strong><small>Intelligence OS</small></span>
          </div>
          <button className="icon-button sidebar-close" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <nav aria-label="Main Navigation">
          <p className="eyebrow">Workspace</p>
          {navItems.slice(0, 10).map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${view === id ? "active" : ""}`} onClick={() => { setView(id); setSidebarOpen(false); }}>
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
          <p className="eyebrow nav-section">Platform</p>
          {navItems.slice(10).map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${view === id ? "active" : ""}`} onClick={() => { setView(id); setSidebarOpen(false); }}>
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-title">
          <button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={20} /></button>
          <span>{viewTitles[view]}</span>
        </div>
        <button className="command-search" aria-label="Open semantic search" onClick={() => setView("search")}>
          <Search size={14} aria-hidden="true" /><span>Search companies, founders, evidence...</span><kbd>⌘ K</kbd>
        </button>
        <div className="top-actions">
          <button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <span className="top-profile">
            <span className="avatar blue small">{initials(user.displayName)}</span>
            <span>{user.displayName}</span>
          </span>
        </div>
      </header>

      {/* Main View Router */}
      <main className="main-content">
        {dataLoading && <div className="workspace-banner"><div className="state-spinner" /><span>Loading verified intelligence...</span></div>}
        {dataError && <div className="workspace-banner error-state"><AlertTriangle size={16} /><span>{dataError}</span><button className="text-button" onClick={() => window.location.reload()}>Retry</button></div>}
        {/* Module 1: Executive Dashboard */}
        {view === "overview" && (
          <div className="view dashboard-view">
            <section className="dashboard-header">
              <div>
                <span className="section-kicker"><Sparkles size={13} /> Investment workspace</span>
                <h1>Good morning, {user.displayName.split(" ")[0]}</h1>
                <p>Prioritized research across your active thesis, sourcing queue, and diligence work.</p>
              </div>
              <div className="hero-actions">
                <button className="secondary-button" onClick={() => setView("search")}><Search size={14} /> Find a company</button>
                <button className="primary-button" onClick={() => setView("discovery")}><Plus size={14} /> Add opportunity</button>
              </div>
            </section>

            <section className="metrics-grid" aria-label="Workspace metrics">
              <article className="metric-card"><div className="metric-icon blue"><Target size={17} /></div><div><p>Active opportunities</p><strong>{summary.active_opportunities}</strong><small>Across your pipeline</small></div><span className="metric-trend">+12%</span></article>
              <article className="metric-card"><div className="metric-icon violet"><FileText size={17} /></div><div><p>Memos ready</p><strong>{summary.memo_ready}</strong><small>Awaiting review</small></div><span className="metric-trend">+4</span></article>
              <article className="metric-card"><div className="metric-icon green"><ShieldCheck size={17} /></div><div><p>Verified claims</p><strong>{summary.verified_claims}</strong><small>Evidence-backed</small></div><span className="metric-trend">+18%</span></article>
              <article className="metric-card"><div className="metric-icon orange"><Radar size={17} /></div><div><p>New signals</p><strong>{summary.raw_signals}</strong><small>Last 7 days</small></div><span className="metric-trend">Live</span></article>
            </section>

            <section className="dashboard-grid dashboard-grid-primary">
              <article className="panel intelligence-panel">
                <div className="panel-heading"><div><h2>Recent analyses</h2><p>Highest-priority founder and company work</p></div><button className="text-button" onClick={() => setView("founder")}>View all <ArrowRight size={13} /></button></div>
                <div className="analysis-list">
                  {founders.slice(0, 4).map((f, index) => (
                    <button key={f.founder_id} className="analysis-row" onClick={() => { setSelectedFounderId(f.founder_id); setView("company"); }}>
                      <span className={`avatar ${["indigo", "cyan", "violet", "green"][index % 4]}`}>{initials(f.company_name)}</span>
                      <span className="founder-copy"><strong>{f.company_name}</strong><small>{f.name} · {labelize(f.source_channel)}</small></span>
                      <span className="signal-tag">{getDecision(f).label}</span><span className="score-badge"><strong>{Math.round(f.founder_score.value)}</strong><small>score</small></span>
                    </button>
                  ))}
                  {!founders.length && <p className="empty-inline">No founder analyses have arrived yet.</p>}
                </div>
              </article>
              <article className="panel intelligence-panel">
                <div className="panel-heading"><div><h2>AI curated signals</h2><p>Evidence-backed changes worth reviewing</p></div><span className="live-dot">Live</span></div>
                <div className="feed-list">
                  {signals.slice(0, 4).map((signal, index) => <div className="feed-item" key={signal.signal_id}><span className={`feed-icon ${["github", "funding", "web", "people"][index % 4]}`}><Zap size={14} /></span><div><strong>{signal.title}</strong><p>{signal.summary}</p><small>{labelize(signal.source)} · {formatDate(signal.observed_at, "Recently")}</small></div></div>)}
                  {!signals.length && <p className="empty-inline">Signal providers are warming up.</p>}
                </div>
              </article>
            </section>

            <section className="dashboard-grid dashboard-grid-secondary">
              <article className="panel momentum-panel"><div className="panel-heading"><div><h2>Watchlist momentum</h2><p>Opportunity coverage across the current workspace</p></div><button className="text-button" onClick={() => setView("watchlists")}>Open watchlist <ArrowRight size={13} /></button></div><div className="chart-summary"><div><strong>{summary.founder_records}</strong><span>tracked records</span></div><div><strong>{summary.average_founder_score ? Math.round(summary.average_founder_score) : "—"}</strong><span>average score</span></div><div><strong>{summary.high_confidence_scores}</strong><span>high confidence</span></div></div><div className="bar-chart" aria-label="Watchlist momentum chart">{[42, 58, 46, 72, 65, 82, 76, 92].map((height, index) => <span key={index}><i style={{ height: `${height}%` }} /></span>)}</div><div className="chart-axis"><span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span></div></article>
              <article className="panel thesis-panel"><div className="panel-heading"><div><h2>Thesis coverage</h2><p>Evidence gates across active work</p></div><ShieldCheck size={16} /></div><div className="thesis-row"><div><span>Build evidence</span><span>{summary.verified_builds}/{summary.founder_records || 0}</span></div><div className="progress"><i style={{ width: `${summary.founder_records ? Math.min(100, (summary.verified_builds / summary.founder_records) * 100) : 0}%` }} /></div></div><div className="thesis-row"><div><span>Verified claims</span><span>{summary.verified_claims}/{summary.verified_claims + summary.unverified_claims || 0}</span></div><div className="progress"><i style={{ width: `${summary.verified_claims + summary.unverified_claims ? (summary.verified_claims / (summary.verified_claims + summary.unverified_claims)) * 100 : 0}%` }} /></div></div><div className="thesis-row"><div><span>Memo readiness</span><span>{summary.memo_ready}/{summary.founder_records || 0}</span></div><div className="progress"><i style={{ width: `${summary.founder_records ? Math.min(100, (summary.memo_ready / summary.founder_records) * 100) : 0}%` }} /></div></div></article>
            </section>

            <section className="panel discoveries-panel"><div className="panel-heading"><div><h2>Recent discoveries</h2><p>Newest opportunities entering the research queue</p></div><button className="text-button" onClick={() => setView("discovery")}>Discovery radar <ArrowRight size={13} /></button></div><div className="discovery-table"><div className="discovery-table-head"><span>Company</span><span>Founder</span><span>Source</span><span>Score</span></div>{founders.slice(0, 5).map(f => <button key={f.founder_id} className="discovery-table-row" onClick={() => { setSelectedFounderId(f.founder_id); setView("company"); }}><strong>{f.company_name}</strong><span>{f.name}</span><span>{labelize(f.source_channel)}</span><b>{Math.round(f.founder_score.value)}</b></button>)}</div></section>
          </div>
        )}

        {/* Module 2: Company Intelligence */}
        {view === "company" && activeFounder && (
          <div className="view">
            <div className="company-header">
              <h1>{activeFounder.company_name}</h1>
              <p>Founder: {activeFounder.name} | Primary Sector: {labelize(String(activeFounder.raw_inputs.sector || "AI Infrastructure"))}</p>
            </div>
            <section className="brief-grid">
              <article className="panel">
                <h2>Technology Stack & Build Evidence</h2>
                <p>Build Status: <strong>{activeFounder.build_evidence.tier}</strong></p>
                <ul>
                  {activeFounder.build_evidence.evidence_log.map((log, idx) => (
                    <li key={idx}><strong>{log.signal}</strong>: {log.detail}</li>
                  ))}
                </ul>
              </article>
              <article className="panel">
                <h2>Risk Matrix & Adversarial View</h2>
                <p><AlertTriangle size={16} /> {String(activeFounder.adversarial_view.bear_case_summary || "No bear case flagged.")}</p>
              </article>
            </section>
          </div>
        )}

        {/* Module 3: Founder Intelligence */}
        {view === "founder" && activeFounder && (
          <div className="view">
            <h1>Founder Intelligence: {activeFounder.name}</h1>
            <p>Company: {activeFounder.company_name} | Score: {Math.round(activeFounder.founder_score.value)} ({Math.round(activeFounder.founder_score.confidence * 100)}% Confidence)</p>
            <section className="panel">
              <h2>Career & Signal History</h2>
              <ul>
                {activeFounder.founder_score.history.map((hist, idx) => (
                  <li key={idx}><strong>{hist.timestamp}</strong>: Score {hist.value} ({hist.context})</li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {/* Module 4: Deal Flow Workspace */}
        {view === "pipeline" && (
          <div className="view">
            <h1>Deal Flow Kanban Pipeline</h1>
            <div className="pipeline-kanban" style={{ display: "flex", gap: "1rem", overflowX: "auto" }}>
              {PIPELINE_STAGES.map(stage => (
                <div key={stage} className="panel" style={{ flex: "1", minWidth: "220px" }}>
                  <h3>{stage}</h3>
                  {founders.filter(f => getDecision(f).label === stage || (stage === "New" && !f.screened_out)).map(f => (
                    <div key={f.founder_id} className="queue-row" onClick={() => { setSelectedFounderId(f.founder_id); setView("company"); }}>
                      <strong>{f.company_name}</strong>
                      <small>{f.name}</small>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module 5: Market Intelligence */}
        {view === "market" && (
          <div className="view">
            <h1>Market Intelligence & Emerging Sector Trends</h1>
            <section className="brief-grid">
              <article className="panel">
                <h2>Sector Funding Activity</h2>
                <p className="empty-inline">No verified sector funding dataset is available for this workspace.</p>
              </article>
              <article className="panel">
                <h2>Technology Trend Radar</h2>
                <p className="empty-inline">No verified trend signals are available for this workspace.</p>
              </article>
            </section>
          </div>
        )}

        {/* Module 7: Semantic Search */}
        {view === "search" && (
          <div className="view">
            <h1>Semantic Search Engine (Hybrid BM25 + Qdrant 1536-dim Vector)</h1>
            <div className="scanner-query">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search companies, founders, patents, or technology claims..." />
              <button className="primary-button"><Search size={16} /> Hybrid Search</button>
            </div>
          </div>
        )}

        {/* Module 8: Watchlists & Custom Alerts */}
        {view === "watchlists" && (
          <div className="view">
            <h1>Watchlists & Custom SLA Alerts</h1>
            <article className="panel">
              <h2>Active SLA Alert Rules</h2>
              <p><BellRing size={16} /> Alert on Contradiction Flags | Confidence Floor: 70% | Stale Evidence: 90 Days</p>
            </article>
          </div>
        )}

        {/* Module 9: Reports & Due Diligence Memos */}
        {view === "reports" && activeFounder && (
          <div className="view">
            <h1>Investment Memo & Due Diligence Report: {activeFounder.company_name}</h1>
            <article className="panel">
              <h2>Executive Summary & Evidence Appendix</h2>
              <p>{String(activeFounder.memo.summary || "Complete investment memo ready for committee review.")}</p>
              <button className="secondary-button"><Download size={16} /> Export PDF Package</button>
            </article>
          </div>
        )}

        {/* Module 10: AI Copilot */}
        {view === "copilot" && <div className="view copilot-view"><div className="module-heading"><div><span className="section-kicker"><Bot size={13} /> Research workspace</span><h1>AI Copilot</h1><p>Ask grounded questions about the selected record and inspect the evidence behind each answer.</p></div><span className="context-pill">{activeFounder ? activeFounder.company_name : "No active context"}</span></div><div className="copilot-layout"><section className="copilot-conversation">{chatMessages.length === 1 && <div className="copilot-start"><h2>How can VC Brain help?</h2><p>Start with a question about the active company, founder, evidence, or decision.</p><div className="suggestion-row">{["What supports this founder score?", "What are the key risks?", "Summarize the evidence gaps."].map(prompt => <button key={prompt} onClick={() => setActiveCopilotQuery(prompt)}>{prompt}</button>)}</div></div>}<div className="message-list">{chatMessages.map(msg => <article key={msg.id} className={`copilot-message ${msg.role}`}><span>{msg.role === "assistant" ? "VC Brain" : "You"}</span><p>{msg.content}</p></article>)}</div></section><aside className="copilot-context"><h2>Current context</h2>{activeFounder ? <><strong>{activeFounder.company_name}</strong><span>{activeFounder.name}</span><div className="context-stat"><b>{Math.round(activeFounder.founder_score.value)}</b><span>Founder score</span></div><div className="context-stat"><b>{activeFounder.source_evidence.length}</b><span>Evidence receipts</span></div><small>Grounded in persisted founder, source, and trust-claim records.</small></> : <p>Select a company from the dashboard to activate context.</p>}</aside></div><div className="copilot-composer"><textarea value={activeCopilotQuery} onChange={e => setActiveCopilotQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void askCopilot(); } }} placeholder="Ask VC Brain about a company, founder, market, thesis, or evidence..." /><button className="primary-button" disabled={copilotLoading} onClick={() => void askCopilot()}>{copilotLoading ? "Analyzing..." : "Send"} <ArrowRight size={14} /></button></div>{copilotError && <p className="copilot-error">{copilotError}</p>}</div>}

        {/* Module 11: Administration */}
        {view === "admin" && (
          <div className="view">
            <h1>Platform Administration, RBAC & Provider Cost Accounting</h1>
            <section className="brief-grid">
              <article className="panel">
                <h2>Subsystem Health SLAs</h2>
                <p>API Gateway: 100% UP | CockroachDB: 6 Nodes Active | Neo4j Cluster: 3 Nodes Active</p>
              </article>
              <article className="panel">
                <h2>Discovery Provider Cost Accounting</h2>
                <p>Exa Neural API: $4.50 | Tavily: $2.10 | SerpAPI: $1.80 | Total MTD: $8.40</p>
              </article>
            </section>
          </div>
        )}

        {/* Platform Modules */}
        {view === "discovery" && <div className="view operational-view"><div className="module-heading"><div><span className="section-kicker"><Radar size={13} /> Platform operation</span><h1>Discovery Radar</h1><p>Continuous discovery across configured intelligence sources.</p></div><button className="primary-button" onClick={() => setView("search")}><Search size={14} /> Review candidates</button></div><div className="ops-stats"><span><b>{discovery?.count ?? 0}</b>Entities found</span><span><b>{discovery?.candidates?.length ?? 0}</b>New signals</span><span><b>{discovery ? "Completed" : "Pending"}</b>Last scan</span></div><section className="panel table-panel"><div className="panel-heading"><div><h2>Newly discovered companies</h2><p>Priority-ranked candidates from the configured discovery service.</p></div><span className="live-dot">{discovery ? "Synced" : "Waiting"}</span></div>{discovery?.candidates?.map(candidate => <div className="ops-row" key={candidate.candidate_id}><strong>{candidate.name}</strong><span>{candidate.primary_domain}</span><span>{candidate.sources.join(" · ")}</span><b>{Math.round(candidate.priority_score * 100)}%</b></div>) || <p className="empty-inline">No candidates returned.</p>}</section></div>}
        {view === "mdm" && <div className="view operational-view"><div className="module-heading"><div><span className="section-kicker"><Target size={13} /> Review workstation</span><h1>Entity Resolution</h1><p>Review canonical records and source authority before making identity decisions.</p></div><button className="secondary-button" onClick={() => setView("company")}>Open company intelligence <ArrowRight size={14} /></button></div><section className="panel table-panel"><div className="panel-heading"><div><h2>Golden master records</h2><p>Persisted records available from the resolution engine.</p></div></div>{founders.slice(0, 8).map(record => <div className="ops-row" key={record.founder_id}><strong>{record.company_name}</strong><span>{record.name}</span><span>{Math.round((record.entity_resolution_confidence || 0) * 100)}% confidence</span><b>{record.source_evidence.length} sources</b></div>) || <p className="empty-inline">No records available.</p>}</section></div>}
        {view === "evidence" && <div className="view operational-view"><div className="module-heading"><div><span className="section-kicker"><FileCheck2 size={13} /> Forensic audit</span><h1>Evidence Receipts</h1><p>Inspect source-backed claims attached to persisted founder records.</p></div></div><section className="panel table-panel"><div className="panel-heading"><div><h2>Receipt explorer</h2><p>Claims, sources, confidence, and verification state.</p></div></div>{founders.flatMap(record => record.source_evidence.slice(0, 2).map((evidence, index) => <div className="ops-row" key={`${record.founder_id}-${index}`}><strong>{record.company_name}</strong><span>{evidence.title}</span><span>{evidence.source}</span><b>{Math.round(evidence.confidence * 100)}%</b></div>)) || <p className="empty-inline">No evidence receipts available.</p>}</section></div>}
        {view === "metrics" && <div className="view operational-view"><div className="module-heading"><div><span className="section-kicker"><Activity size={13} /> Platform observability</span><h1>System Health</h1><p>Live subsystem status from the VC Brain health endpoint.</p></div><span className="health-status"><CheckCircle2 size={14} /> {health?.status || "Unknown"}</span></div><section className="health-grid">{Object.entries(health?.subsystems || {}).map(([key, service]) => <article className="health-row" key={key}><span className="health-indicator" /><div><strong>{labelize(key)}</strong><small>{service.provider || "Configured service"}</small></div><span>{service.latency_p95_ms ? `${service.latency_p95_ms}ms p95` : service.nodes ? `${service.nodes} nodes` : "Operational"}</span><b>{service.status}</b></article>)}</section></div>}
        {view === "graph" && <div className="view operational-view"><div className="module-heading"><div><span className="section-kicker"><Globe2 size={13} /> Relationship explorer</span><h1>Knowledge Graph</h1><p>Explore persisted ontology nodes and weighted relationships from the graph service.</p></div><span className="context-pill">{graph?.nodes?.length || 0} nodes · {graph?.edges?.length || 0} edges</span></div><section className="graph-workspace"><div className="graph-canvas">{graph?.nodes?.map((node, index) => <span className={`graph-node node-${index}`} key={node.id} title={String(node.properties.name || node.properties.full_name || node.id)}>{String(node.properties.name || node.properties.full_name || "Entity").slice(0, 16)}</span>) || <p className="empty-inline">Graph data unavailable.</p>}</div><aside className="graph-legend"><h2>Ontology</h2><p>Nodes and edges are loaded from the graph API. Select a node to continue exploration.</p>{graph?.nodes?.map(node => <div key={node.id}><b>{String(node.properties.name || node.properties.full_name)}</b><small>{node.labels.join(" · ")}</small></div>)}</aside></section></div>}
        {view === "company" && !activeFounder && <div className="view"><div className="module-empty"><Building2 size={22} /><h1>Company Intelligence</h1><p>Select a company from recent analyses or load verified founder records to begin research.</p><button className="primary-button" onClick={() => setView("discovery")}>Open Discovery Radar <ArrowRight size={14} /></button></div></div>}
        {view === "founder" && !activeFounder && <div className="view"><div className="module-empty"><Users size={22} /><h1>Founder Intelligence</h1><p>No verified founder record is selected yet.</p><button className="secondary-button" onClick={() => setView("search")}>Search founders <Search size={14} /></button></div></div>}
        {view === "reports" && !activeFounder && <div className="view"><div className="module-empty"><FileText size={22} /><h1>Reports & Memos</h1><p>No company is selected for memo generation.</p><button className="secondary-button" onClick={() => setView("pipeline")}>Open Deal Flow <ArrowRight size={14} /></button></div></div>}
      </main>
    </div>
  );
}
