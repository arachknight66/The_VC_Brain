"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Clock3,
  FileCheck2,
  Github,
  Globe2,
  Linkedin,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Upload,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type View = "dashboard" | "scanner" | "intake" | "discovery" | "company" | "diligence";

type Signal = {
  signal_id: string;
  source: string;
  title: string;
  source_url: string;
  summary: string;
  score: number;
  observed_at: string;
};

type AxisScore = {
  rating: string;
  score: number;
  trend: string;
  rationale: string;
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
  founder_score: {
    value: number;
    trend: "improving" | "stable" | "declining";
    confidence: number;
    confidence_basis: string | null;
    history: Array<{ timestamp: string; value: number; context: string }>;
  };
  axis_scores: Record<string, AxisScore>;
  build_evidence: {
    tier: "verified_working" | "verified_submitted" | "unverifiable" | "not_applicable";
    signals_checked: string[];
    evidence_log: Array<{ signal: string; found: boolean; detail: string; source_url: string | null }>;
  };
  trust_claims: TrustClaim[];
  source_evidence: Array<{ source: string; title: string; url: string; confidence: number }>;
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

type DecisionStatus = "advance" | "review" | "blocked" | "pass";

type DecisionSummary = {
  status: DecisionStatus;
  recommendation: string;
  confidence: "Low" | "Medium" | "High";
  rationale: string[];
  gaps: string[];
  nextAction: string;
};

const API_BASE = process.env.NEXT_PUBLIC_VC_BRAIN_API_URL ?? "http://localhost:8000";
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

const EMPTY_SUMMARY: DashboardSummary = {
  founder_records: 0,
  active_opportunities: 0,
  raw_signals: 0,
  memo_ready: 0,
  high_confidence_scores: 0,
  verified_builds: 0,
  verified_claims: 0,
  unverified_claims: 0,
  average_founder_score: 0,
  average_score_confidence: 0,
  average_signal_to_memo_seconds: null,
};

function createMockFounder({
  id,
  name,
  company,
  sector,
  stage,
  score,
  confidence,
  trend,
}: {
  id: string;
  name: string;
  company: string;
  sector: string;
  stage: string;
  score: number;
  confidence: number;
  trend: "improving" | "stable" | "declining";
}): FounderRecord {
  return {
    founder_id: id,
    name,
    company_name: company,
    source_channel: "inbound",
    screened_out: false,
    screened_out_reason: null,
    entity_resolution_confidence: confidence,
    raw_inputs: { sector, stage, geography: "United States" },
    founder_score: {
      value: score,
      trend,
      confidence,
      confidence_basis: "mock_demo_fixture",
      history: [{ timestamp: "2026-07-14T12:00:00Z", value: score - 4, context: "mock_previous_run" }],
    },
    axis_scores: {
      founder: { rating: "strong", score: Math.min(100, score + 4), trend, rationale: `${name} shows strong founder-axis evidence in the retained demo fixture.` },
      market: { rating: "bullish", score: Math.max(0, score - 5), trend: "stable", rationale: `${sector} has favorable market signals in the retained demo fixture.` },
      idea_vs_market: { rating: "resilient", score: Math.max(0, score - 1), trend, rationale: "The idea-vs-market assessment remains resilient under the demo assumptions." },
    },
    build_evidence: {
      tier: "verified_working",
      signals_checked: ["GitHub repository", "Live product URL"],
      evidence_log: [{ signal: "Live product URL", found: true, detail: "Demo fixture represents a reachable product.", source_url: "https://example.com" }],
    },
    trust_claims: [
      { claim_text: "Product usage is growing", confidence: 0.9, evidence_category: "known_verified", source: "Mock product analytics", contradiction_flag: false },
      { claim_text: "Enterprise expansion is repeatable", confidence: 0.62, evidence_category: "statistical_association", source: "Mock customer evidence", contradiction_flag: false },
    ],
    source_evidence: [{ source: "linkedin", title: `${name} public profile`, url: "https://www.linkedin.com", confidence: 0.9 }],
    memo: {
      company_snapshot: `${company} is a retained demo company in ${sector}, shown only when the mock-data feature flag is enabled.`,
      investment_hypotheses: ["Founder experience maps to the stated problem.", "Public build evidence supports execution velocity."],
    },
    adversarial_view: { bear_case_summary: "The retained mock case still requires customer and market validation." },
    timing: { elapsed_seconds: 14.2, memo_ready_at: "2026-07-14T12:00:14Z", stage_timings: { entity_resolution: 0.4, scoring: 8.1, memo: 5.7 } },
  };
}

// Retained demo fixtures. They are intentionally disabled unless
// NEXT_PUBLIC_USE_MOCK_DATA=true is supplied at build/runtime startup.
const MOCK_FOUNDERS: FounderRecord[] = [
  createMockFounder({ id: "mock-priya", name: "Priya Nandakumar", company: "Ridgeline", sector: "Developer tools", stage: "Seed", score: 92, confidence: 0.92, trend: "improving" }),
  createMockFounder({ id: "mock-marcus", name: "Marcus Ihediwa", company: "Ledgerly", sector: "Embedded finance", stage: "Pre-seed", score: 84, confidence: 0.81, trend: "improving" }),
  createMockFounder({ id: "mock-alina", name: "Alina Moroz", company: "NeuroStream", sector: "Healthcare AI", stage: "Series A", score: 88, confidence: 0.87, trend: "improving" }),
  createMockFounder({ id: "mock-julian", name: "Julian Vance", company: "Conduit Labs", sector: "Climate infrastructure", stage: "Seed", score: 79, confidence: 0.76, trend: "stable" }),
  createMockFounder({ id: "mock-sana", name: "Sana Jenkins", company: "Fieldnote", sector: "Vertical SaaS", stage: "Pre-seed", score: 76, confidence: 0.73, trend: "improving" }),
  createMockFounder({ id: "mock-leo", name: "Leo Chen", company: "Onward Robotics", sector: "Robotics", stage: "Seed", score: 81, confidence: 0.79, trend: "stable" }),
];

const MOCK_SIGNALS: Signal[] = [
  { signal_id: "mock-signal-github", source: "github", title: "Ridgeline shipped 3 releases", source_url: "https://github.com", summary: "Repository activity increased in the retained demo fixture.", score: 88, observed_at: "2026-07-14T12:00:00Z" },
  { signal_id: "mock-signal-linkedin", source: "linkedin", title: "NeuroStream expanded its ML team", source_url: "https://www.linkedin.com", summary: "Public hiring evidence is represented by this disabled demo signal.", score: 82, observed_at: "2026-07-14T11:00:00Z" },
  { signal_id: "mock-signal-devpost", source: "devpost", title: "Conduit Labs demo submission found", source_url: "https://devpost.com", summary: "A public build submission is represented by this disabled demo signal.", score: 77, observed_at: "2026-07-14T10:00:00Z" },
  { signal_id: "mock-signal-substack", source: "substack", title: "Fieldnote founder published a market thesis", source_url: "https://substack.com", summary: "A founder-authored public research signal is retained for demos.", score: 71, observed_at: "2026-07-14T09:00:00Z" },
];

const MOCK_SUMMARY: DashboardSummary = {
  founder_records: MOCK_FOUNDERS.length,
  active_opportunities: MOCK_FOUNDERS.length,
  raw_signals: MOCK_SIGNALS.length,
  memo_ready: MOCK_FOUNDERS.length,
  high_confidence_scores: MOCK_FOUNDERS.filter((founder) => founder.founder_score.confidence >= 0.75).length,
  verified_builds: MOCK_FOUNDERS.filter((founder) => founder.build_evidence.tier === "verified_working").length,
  verified_claims: MOCK_FOUNDERS.reduce((total, founder) => total + founder.trust_claims.filter((claim) => claim.evidence_category === "known_verified").length, 0),
  unverified_claims: 0,
  average_founder_score: Math.round(MOCK_FOUNDERS.reduce((total, founder) => total + founder.founder_score.value, 0) / MOCK_FOUNDERS.length * 10) / 10,
  average_score_confidence: Math.round(MOCK_FOUNDERS.reduce((total, founder) => total + founder.founder_score.confidence, 0) / MOCK_FOUNDERS.length * 100) / 100,
  average_signal_to_memo_seconds: 14.2,
};

const avatarTones = ["indigo", "orange", "cyan", "violet", "green", "blue"];

function founderInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "VC";
}

function founderTone(founder: FounderRecord) {
  const hash = [...founder.founder_id].reduce((total, character) => total + character.charCodeAt(0), 0);
  return avatarTones[hash % avatarTones.length];
}

function formatMetric(value: number | null, suffix = "") {
  return value === null ? "—" : `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
}

function labelize(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Not available";
}

function formatFreshness(value: string | null | undefined, label = "Evaluated") {
  if (!value) return `${label} time unavailable`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `${label} time unavailable`;
  return `${label} ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date)}`;
}

function getMemoReady(founder: FounderRecord) {
  return Boolean(
    founder.source_evidence.length
    && founder.trust_claims.length
    && founder.trust_claims.every((claim) => claim.evidence_category === "known_verified" && !claim.contradiction_flag)
    && founder.founder_score.confidence >= 0.75
    && typeof founder.memo.company_snapshot === "string",
  );
}

function getDecisionSummary(founder: FounderRecord): DecisionSummary {
  const verifiedClaims = founder.trust_claims.filter((claim) => claim.evidence_category === "known_verified" && !claim.contradiction_flag);
  const unresolvedClaims = founder.trust_claims.filter((claim) => claim.evidence_category !== "known_verified" || claim.contradiction_flag);
  const gaps: string[] = [];
  if (!founder.source_evidence.length) gaps.push("No source evidence records are attached.");
  if (!founder.trust_claims.length) gaps.push("No claim-level evidence was extracted.");
  if (unresolvedClaims.length) gaps.push(`${unresolvedClaims.length} claim${unresolvedClaims.length === 1 ? "" : "s"} require review.`);
  if (founder.founder_score.confidence < 0.75) gaps.push(`Founder Score confidence is only ${Math.round(founder.founder_score.confidence * 100)}%.`);

  if (founder.screened_out) {
    return {
      status: "pass",
      recommendation: "Pass",
      confidence: founder.screened_out_reason ? "High" : "Medium",
      rationale: [founder.screened_out_reason || "The company is outside the configured investment thesis."],
      gaps,
      nextAction: "Confirm the thesis-screen decision or record an override.",
    };
  }

  if (!founder.source_evidence.length || !founder.trust_claims.length) {
    return {
      status: "blocked",
      recommendation: "Hold — evidence incomplete",
      confidence: "Low",
      rationale: ["The current record cannot support an investment decision.", "Scores are provisional until source and claim evidence exist."],
      gaps,
      nextAction: "Attach source evidence and complete claim extraction before partner review.",
    };
  }

  if (unresolvedClaims.length || founder.founder_score.confidence < 0.75) {
    return {
      status: "review",
      recommendation: "Continue diligence",
      confidence: founder.founder_score.confidence >= 0.6 ? "Medium" : "Low",
      rationale: [`${verifiedClaims.length} verified claim${verifiedClaims.length === 1 ? "" : "s"} support the case.`, "Material uncertainty remains unresolved."],
      gaps,
      nextAction: "Resolve the highest-impact claim and record the reviewer decision.",
    };
  }

  return {
    status: "advance",
    recommendation: "Advance to partner review",
    confidence: "High",
    rationale: [`${verifiedClaims.length} claims are source-backed with no contradiction flags.`, "The evidence gate for a decision-ready memo is satisfied."],
    gaps: [],
    nextAction: "Schedule partner review and confirm ownership of the investment memo.",
  };
}

function viewFromLocation(): { view: View; founderId: string | null } {
  if (typeof window === "undefined") return { view: "dashboard", founderId: null };
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (!segments.length) return { view: "dashboard", founderId: null };
  if (segments[0] === "signals") return { view: "scanner", founderId: null };
  if (segments[0] === "intake") return { view: "intake", founderId: null };
  if (segments[0] === "discovery") return { view: "discovery", founderId: null };
  if (segments[0] === "companies") return { view: "company", founderId: segments[1] ? decodeURIComponent(segments[1]) : null };
  if (segments[0] === "diligence") return { view: "diligence", founderId: segments[1] ? decodeURIComponent(segments[1]) : null };
  return { view: "dashboard", founderId: null };
}

function urlForView(view: View, founderId?: string | null) {
  if (view === "dashboard") return "/";
  if (view === "scanner") return "/signals";
  if (view === "intake") return "/intake";
  if (view === "discovery") return "/discovery";
  if (view === "company") return founderId ? `/companies/${encodeURIComponent(founderId)}` : "/companies";
  return founderId ? `/diligence/${encodeURIComponent(founderId)}` : "/diligence";
}

const navItems = [
  { id: "dashboard" as View, label: "Dashboard", icon: LayoutDashboard },
  { id: "scanner" as View, label: "Signal Scanner", icon: Zap },
  { id: "intake" as View, label: "Pitch Intake", icon: Upload },
  { id: "discovery" as View, label: "Discovery", icon: Search },
  { id: "company" as View, label: "Companies", icon: BriefcaseBusiness },
  { id: "diligence" as View, label: "Diligence", icon: ShieldCheck },
];

const viewTitles: Record<View, string> = {
  dashboard: "Intelligence Overview",
  scanner: "Signal Scanner",
  intake: "Pitch Intake",
  discovery: "Founder Discovery",
  company: "Company Intelligence",
  diligence: "Diligence Workspace",
};

function Logo() {
  return (
    <div className="logo" aria-label="The VC Brain">
      <span className="logo-mark"><span /><span /><span /><span /></span>
      <span><strong>The VC Brain</strong><small>Intelligence Platform</small></span>
    </div>
  );
}

function Avatar({ founder, small = false }: { founder: FounderRecord; small?: boolean }) {
  return <span className={`avatar ${founderTone(founder)} ${small ? "small" : ""}`}>{founderInitials(founder.name)}</span>;
}

function Sidebar({ view, onView, open, onClose, reviewCount }: { view: View; onView: (view: View) => void; open: boolean; onClose: () => void; reviewCount: number }) {
  return (
    <>
      {open && <button className="scrim" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav aria-label="Primary navigation">
          <p className="eyebrow">Workspace</p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => { onView(id); onClose(); }}
            >
              <Icon size={17} strokeWidth={1.9} /><span>{label}</span>
              {id === "diligence" && reviewCount > 0 && <span className="nav-count">{reviewCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user">
            <span className="avatar blue small">AK</span>
            <span><strong>Arjun Kapoor</strong><small>Investor</small></span>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ view, onMenu, onSearch }: { view: View; onMenu: () => void; onSearch: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
        <span>{viewTitles[view]}</span>
      </div>
      <button className="command-search" onClick={onSearch}>
        <Search size={15} /><span>Quick actions</span><kbd>⌘ K</kbd>
      </button>
      <div className="top-actions">
        <span className="avatar blue small">AK</span>
      </div>
    </header>
  );
}

function MetricCard({ icon: Icon, label, value, meta, tone, loading = false }: { icon: typeof Activity; label: string; value: string; meta: string; tone: string; loading?: boolean }) {
  return (
    <article className={`metric-card ${loading ? "loading" : ""}`} aria-busy={loading}>
      <div className={`metric-icon ${tone}`}><Icon size={18} /></div>
      <div><p>{label}</p><strong>{loading ? "—" : value}</strong><small>{loading ? "Loading current data…" : meta}</small></div>
    </article>
  );
}

function Dashboard({
  onView,
  onFounder,
  founders,
  signals,
  summary,
  loading,
  error,
}: {
  onView: (view: View) => void;
  onFounder: (founderId: string) => void;
  founders: FounderRecord[];
  signals: Signal[];
  summary: DashboardSummary;
  loading: boolean;
  error: string;
}) {
  const bars = founders.length ? founders.slice(0, 12).map((founder) => Math.max(8, founder.founder_score.value)) : [8, 8, 8, 8];
  const sectors = Object.entries(founders.reduce<Record<string, number>>((counts, founder) => {
    const sector = String(founder.raw_inputs.sector || "Unclassified");
    counts[sector] = (counts[sector] || 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4);
  return (
    <div className="view dashboard-view">
      <section className="hero-row">
        <div>
          <span className="section-kicker"><Sparkles size={14} /> Persisted intelligence</span>
          <h1>Good morning, Arjun.</h1>
          <p>{loading ? "Loading the current decision pipeline…" : <>Your pipeline contains <strong>{summary.active_opportunities} active opportunities</strong> and {summary.raw_signals} raw sourcing signals.</>}</p>
        </div>
        <div className="hero-actions">
          <button className="secondary-button" onClick={() => onView("intake")}><Plus size={16} /> Add company</button>
          <button className="primary-button" onClick={() => onView("scanner")}><Search size={16} /> Scan live signals</button>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Workflow metrics">
        <MetricCard loading={loading} icon={Users} label="Founder records" value={String(summary.founder_records)} meta={`${summary.active_opportunities} active opportunities`} tone="blue" />
        <MetricCard loading={loading} icon={Zap} label="Raw signals" value={String(summary.raw_signals)} meta="Unreviewed sourcing evidence" tone="violet" />
        <MetricCard loading={loading} icon={ShieldCheck} label="High-confidence scores" value={String(summary.high_confidence_scores)} meta={`Average confidence ${Math.round(summary.average_score_confidence * 100)}%`} tone="green" />
        <MetricCard loading={loading} icon={FileCheck2} label="Backend memo records" value={String(summary.memo_ready)} meta={`${summary.unverified_claims} claims still require review`} tone="orange" />
      </section>
      {error && <p className="workflow-error">{error}</p>}

      <section className="dashboard-grid">
        <article className="panel recent-panel">
          <div className="panel-heading">
            <div><h2>Ranked opportunities</h2><p>Ordered by persistent Founder Score</p></div>
            <button className="text-button" onClick={() => onView("discovery")}>View all <ArrowRight size={14} /></button>
          </div>
          <div className="analysis-list">
            {founders.slice(0, 4).map((founder) => (
              <button className="analysis-row" key={founder.founder_id} onClick={() => onFounder(founder.founder_id)}>
                <Avatar founder={founder} />
                <span className="founder-copy"><strong>{founder.company_name}</strong><small>{founder.name} · {labelize(String(founder.raw_inputs.sector || founder.source_channel))}</small><small>{Math.round(founder.founder_score.confidence * 100)}% confidence · {formatFreshness(founder.timing.memo_ready_at)}</small></span>
                <span className="signal-tag">{labelize(founder.founder_score.trend)}</span>
                <span className="score-badge" title={`${Math.round(founder.founder_score.confidence * 100)}% confidence · ${formatFreshness(founder.timing.memo_ready_at)}`}><strong>{Math.round(founder.founder_score.value)}</strong><small>/100 provisional</small></span>
                <ArrowRight size={15} />
              </button>
            ))}
            {!founders.length && <div className="inline-empty">{loading ? "Loading founder records…" : "No founder records have been persisted yet."}</div>}
          </div>
        </article>

        <article className="panel feed-panel">
          <div className="panel-heading">
            <div><h2>Raw signal feed</h2><p>Unconfirmed, source-attributed scanner results</p></div>
            <span className="live-dot">{signals.length} stored</span>
          </div>
          <div className="feed-list">
            {signals.slice(0, 4).map((signal) => (
              <div className="feed-item" key={signal.signal_id}><span className={`feed-icon ${signal.source === "github" ? "github" : "web"}`}>{signal.source === "github" ? <Github size={15} /> : <Globe2 size={15} />}</span><div><strong>{signal.title}</strong><p>{signal.summary || "No public excerpt was returned."}</p><small>{labelize(signal.source)} · unreviewed relevance {Math.round(signal.score)} · {formatFreshness(signal.observed_at, "Observed")}</small></div></div>
            ))}
            {!signals.length && <div className="inline-empty">Run the Signal Scanner to persist raw sourcing evidence.</div>}
          </div>
        </article>

        <article className="panel momentum-panel">
          <div className="panel-heading">
            <div><h2>Score distribution</h2><p>Founder Score across ranked opportunities</p></div>
            <span className="status-pill">Persisted records</span>
          </div>
          <div className="chart-summary">
            <div><strong>{summary.raw_signals}</strong><span>Raw signals</span></div>
            <div><strong>{formatMetric(summary.average_founder_score)}</strong><span>Average Founder Score</span></div>
            <div><strong>{formatMetric(summary.average_signal_to_memo_seconds, "s")}</strong><span>Average signal → memo</span></div>
          </div>
          <div className="bar-chart" aria-label="Increasing signal volume">
            {bars.map((height, index) => <span key={index} style={{ height: `${height}%` }}><i /></span>)}
          </div>
          <div className="chart-axis"><span>Highest</span><span>Ranked by score</span><span>Lowest</span></div>
        </article>

        <article className="panel thesis-panel">
          <div className="panel-heading"><div><h2>Sector coverage</h2><p>Founder records by declared sector</p></div></div>
          {sectors.map(([label, count]) => (
            <div className="thesis-row" key={label}>
              <div><strong>{label}</strong><span>{count} record{count === 1 ? "" : "s"}</span></div>
              <div className="progress"><i style={{ width: `${Math.max(10, (count / Math.max(1, founders.length)) * 100)}%` }} /></div>
            </div>
          ))}
          {!sectors.length && <div className="inline-empty">Sector coverage appears after founder intake.</div>}
        </article>
      </section>
    </div>
  );
}

function Discovery({ founders, onCompany }: { founders: FounderRecord[]; onCompany: (founderId: string) => void }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");
  const [sector, setSector] = useState("all");
  const [sort, setSort] = useState("score");
  const stages = useMemo(() => [...new Set(founders.map((founder) => String(founder.raw_inputs.stage || "")).filter(Boolean))].sort(), [founders]);
  const sectors = useMemo(() => [...new Set(founders.map((founder) => String(founder.raw_inputs.sector || "")).filter(Boolean))].sort(), [founders]);
  const filtered = useMemo(() => founders
    .filter((founder) => `${founder.name} ${founder.company_name} ${String(founder.raw_inputs.sector || "")} ${String(founder.raw_inputs.stage || "")} ${founder.source_channel} ${founder.build_evidence.signals_checked.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    .filter((founder) => stage === "all" || String(founder.raw_inputs.stage || "") === stage)
    .filter((founder) => sector === "all" || String(founder.raw_inputs.sector || "") === sector)
    .sort((a, b) => sort === "confidence" ? b.founder_score.confidence - a.founder_score.confidence : b.founder_score.value - a.founder_score.value), [founders, query, sector, sort, stage]);
  return (
    <div className="view discovery-view">
      <section className="discovery-hero">
        <span className="section-kicker"><Target size={14} /> Founder discovery</span>
        <h1>Discover your next big founder.</h1>
        <p>Search persisted founder records ranked by Founder Score and evidence confidence.</p>
        <label className="big-search">
          <Search size={19} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search founder, company, sector, stage, or evidence source" />
          {query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={18} /></button>}
        </label>
        <div className="quick-searches">
          <span>Explore:</span><button onClick={() => setQuery("Developer tools")}>Developer tools</button><button onClick={() => setQuery("Healthcare AI")}>Healthcare AI</button><button onClick={() => setQuery("GitHub")}>GitHub evidence</button>
        </div>
      </section>
      <div className="results-bar">
        <div><strong>{filtered.length} founder records</strong><span> ranked by Founder Score</span></div>
        <div className="filter-actions">
          <label className="select-control"><span className="sr-only">Filter by stage</span><select value={stage} onChange={(event) => setStage(event.target.value)}><option value="all">All stages</option>{stages.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select><ChevronDown size={14} /></label>
          <label className="select-control"><span className="sr-only">Filter by sector</span><select value={sector} onChange={(event) => setSector(event.target.value)}><option value="all">All sectors</option>{sectors.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select><ChevronDown size={14} /></label>
          <label className="select-control"><span className="sr-only">Sort founder records</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="score">Sort: Founder Score</option><option value="confidence">Sort: Confidence</option></select><ChevronDown size={14} /></label>
        </div>
      </div>
      <section className="founder-grid">
        {filtered.map((founder) => (
          <article className="founder-card" key={founder.founder_id}>
            <div className="founder-card-top"><Avatar founder={founder} /><span className="fit-pill">{Math.round(founder.founder_score.confidence * 100)}% confidence</span></div>
            <h2>{founder.name}</h2><p className="company-line">{founder.company_name} <span>·</span> {labelize(String(founder.raw_inputs.stage || founder.source_channel))}</p>
            <p className="founder-summary">{founder.axis_scores.founder?.rationale || founder.screened_out_reason || "Analysis is available from the persisted founder record."}</p>
            <div className="evidence-chips"><span><ShieldCheck size={13} /> {labelize(founder.build_evidence.tier)}</span><span><TrendingUp size={13} /> {labelize(founder.founder_score.trend)}</span></div>
            <div className="card-score"><span><small>Provisional Founder Score</small><strong>{Math.round(founder.founder_score.value)}<em>/100</em></strong><small>{labelize(founder.founder_score.confidence_basis)} · {formatFreshness(founder.timing.memo_ready_at)}</small></span><div className="mini-ring" style={{ "--score": `${founder.founder_score.value * 3.6}deg` } as React.CSSProperties}><span>{Math.round(founder.founder_score.value)}</span></div></div>
            <div className="card-actions"><span className="status-pill">{labelize(founder.source_channel)}</span><button className="primary-button" onClick={() => onCompany(founder.founder_id)}>Open analysis <ArrowRight size={14} /></button></div>
          </article>
        ))}
        {!filtered.length && <div className="empty-state"><Users size={24} /><strong>No matching founder records</strong><p>Submit a pitch or adjust the search query.</p></div>}
      </section>
    </div>
  );
}

function ScoreBar({ label, value, provenance }: { label: string; value: number; provenance?: string }) {
  return <div className="score-line"><div><span>{label}</span><strong>{value}</strong></div><div className="progress"><i style={{ width: `${value}%` }} /></div>{provenance && <small>{provenance}</small>}</div>;
}

function Company({ founder, onDiligence }: { founder: FounderRecord | null; onDiligence: () => void }) {
  if (!founder) {
    return <div className="view"><div className="empty-state"><BriefcaseBusiness size={24} /><strong>No founder selected</strong><p>Choose a founder record from Ranked Opportunities or Founder Discovery.</p></div></div>;
  }
  const memoSnapshot = typeof founder.memo.company_snapshot === "string"
    ? founder.memo.company_snapshot
    : "No company snapshot was generated for this record.";
  const hypotheses = Array.isArray(founder.memo.investment_hypotheses)
    ? founder.memo.investment_hypotheses.filter((item): item is string => typeof item === "string")
    : [];
  const trustConfidence = founder.trust_claims.length
    ? Math.round(founder.trust_claims.reduce((total, claim) => total + claim.confidence, 0) / founder.trust_claims.length * 100)
    : 0;
  const watchItems = founder.trust_claims.filter((claim) => claim.evidence_category === "unverifiable" || claim.contradiction_flag);
  const decision = getDecisionSummary(founder);
  const memoReady = getMemoReady(founder);
  const evaluatedAt = formatFreshness(founder.timing.memo_ready_at);
  return (
    <div className="view company-view">
      <div className="company-header">
        <div className="company-identity"><span className="company-logo">{founder.company_name[0]?.toUpperCase()}</span><div><span className="section-kicker">{labelize(String(founder.raw_inputs.sector || "Unclassified"))} · {labelize(String(founder.raw_inputs.stage || founder.source_channel))}</span><h1>{founder.company_name}</h1><p>{founder.name} · {labelize(founder.founder_score.trend)} Founder Score trend</p></div></div>
        <div className="hero-actions"><a className="secondary-button" href="#source-evidence"><Globe2 size={16} /> {founder.source_evidence.length} source evidence</a><button className="primary-button" onClick={onDiligence}><ShieldCheck size={16} /> Open claims verification</button></div>
      </div>
      <div className="company-layout">
        <div className="company-main">
          <article className={`panel decision-summary ${decision.status}`}>
            <div className="decision-summary-head">
              <div><span className="section-kicker"><Lightbulb size={14} /> Decision status</span><h2>{decision.recommendation}</h2><p>{decision.confidence} confidence · {evaluatedAt}</p></div>
              <span className={`decision-status ${decision.status}`}>{labelize(decision.status)}</span>
            </div>
            <div className="decision-columns">
              <div><h3>Why</h3>{decision.rationale.map((item) => <p key={item}><Check size={15} />{item}</p>)}</div>
              <div><h3>{decision.gaps.length ? "Blocking evidence gaps" : "Evidence gate"}</h3>{decision.gaps.length ? decision.gaps.map((item) => <p key={item}><AlertTriangle size={15} />{item}</p>) : <p><Check size={15} />Required sources and claims are verified.</p>}</div>
            </div>
            <div className="next-action"><strong>Next action</strong><span>{decision.nextAction}</span></div>
          </article>
          <article className="panel executive-card">
            <div className="panel-heading"><div><span className="section-kicker"><Bot size={14} /> AI-generated working draft</span><h2>Company snapshot</h2></div><span className={`confidence-pill ${memoReady ? "" : "warning"}`}>{memoReady ? <Check size={13} /> : <AlertTriangle size={13} />} {memoReady ? "Decision-ready" : "Evidence incomplete"}</span></div>
            <p>{memoSnapshot}</p>
            <div className="summary-tags"><span className={founder.build_evidence.evidence_log.length ? "" : "neutral"}>{founder.build_evidence.evidence_log.length ? `${labelize(founder.build_evidence.tier)} · ${founder.build_evidence.evidence_log.length} build checks` : "Build status unknown"}</span><span className={founder.trust_claims.length ? "" : "neutral"}>{founder.trust_claims.length ? `${founder.trust_claims.length} trust claims` : "Claims not extracted"}</span><span className={founder.source_evidence.length ? "" : "neutral"}>{founder.source_evidence.length ? `${founder.source_evidence.length} source evidence` : "No source evidence"}</span>{founder.screened_out && <span className="warning">Screened out</span>}</div>
          </article>
          <section className="company-stats">
            <article className="panel stat-box"><small>Provisional Founder Score</small><strong>{formatMetric(founder.founder_score.value)}</strong><span>{Math.round(founder.founder_score.confidence * 100)}% confidence · {evaluatedAt}</span></article>
            <article className="panel stat-box"><small>Evidence Coverage</small><strong>{founder.source_evidence.length + founder.trust_claims.length}</strong><span>{founder.source_evidence.length} sources · {founder.trust_claims.length} claims</span></article>
            <article className="panel stat-box"><small>Decision Readiness</small><strong>{memoReady ? "Ready" : "Blocked"}</strong><span>{memoReady ? "Evidence gate satisfied" : "Resolve evidence gaps first"}</span></article>
          </section>
          <article className="panel">
            <div className="panel-heading"><div><h2>Why this could win</h2><p>AI hypotheses — verify against attached evidence</p></div>{founder.source_evidence.length > 0 && <a className="text-button" href="#source-evidence">View sources <ArrowRight size={14} /></a>}</div>
            <div className="hypothesis-list">{hypotheses.map((hypothesis, index) => <div key={hypothesis}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>Investment hypothesis</strong><p>{hypothesis}</p></div></div>)}{!hypotheses.length && <div className="inline-empty">No investment hypotheses were generated.</div>}</div>
          </article>
          <article className="panel team-panel" id="source-evidence">
            <div className="panel-heading"><div><h2>Founder identity</h2><p>Entity resolution and source coverage</p></div></div>
            <div className="team-grid"><div><Avatar founder={founder} /><strong>{founder.name}</strong><small>{founder.entity_resolution_confidence === null ? "No external identity match" : `${Math.round(founder.entity_resolution_confidence * 100)}% entity resolution confidence · ${evaluatedAt}`}</small></div><div><span className="avatar cyan">{founder.source_evidence.length}</span><strong>Source evidence</strong><small>{founder.source_evidence.map((item) => `${labelize(item.source)} (${Math.round(item.confidence * 100)}%)`).join(", ") || "None collected — identity claims remain unverified"}</small></div></div>
            {founder.source_evidence.length > 0 && <div className="source-evidence-list">{founder.source_evidence.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={`${item.source}-${item.url}`}><Globe2 size={15} /><span><strong>{item.title}</strong><small>{labelize(item.source)} · {Math.round(item.confidence * 100)}% source confidence</small></span><ArrowRight size={14} /></a>)}</div>}
          </article>
        </div>
        <aside className="company-rail">
          <article className="panel overall-score"><span className="mini-ring large" style={{ "--score": `${founder.founder_score.value * 3.6}deg` } as React.CSSProperties}><strong>{Math.round(founder.founder_score.value)}</strong><small>/100</small></span><div><span>Provisional Founder Score</span><strong>{labelize(founder.founder_score.trend)}</strong><small>{Math.round(founder.founder_score.confidence * 100)}% confidence · {evaluatedAt}</small></div></article>
          <article className="panel scorecard"><div className="panel-heading"><div><h2>Independent axis scores</h2><p>Model-derived · {evaluatedAt}</p></div></div><ScoreBar label="Founder Axis" value={Math.round(founder.axis_scores.founder?.score || 0)} provenance={founder.axis_scores.founder?.rationale} /><ScoreBar label="Market Axis" value={Math.round(founder.axis_scores.market?.score || 0)} provenance={founder.axis_scores.market?.rationale} /><ScoreBar label="Idea-vs-Market Axis" value={Math.round(founder.axis_scores.idea_vs_market?.score || 0)} provenance={founder.axis_scores.idea_vs_market?.rationale} /><ScoreBar label="Trust Claim Confidence" value={trustConfidence} provenance={founder.trust_claims.length ? `${founder.trust_claims.length} extracted claims` : "Unavailable — no claims extracted"} /></article>
          <article className="panel watch-card"><div className="panel-heading"><div><h2>Unverified or contradicted claims</h2></div><span>{watchItems.length}</span></div>{watchItems.slice(0, 4).map((claim) => <p key={claim.claim_text}><i className={claim.contradiction_flag ? "high" : "medium"} /> {claim.claim_text}</p>)}{!founder.trust_claims.length ? <p className="unknown"><i /> Claim extraction is incomplete; review is blocked.</p> : !watchItems.length && <p><i className="low" /> All extracted claims are verified.</p>}</article>
          <button className="primary-button wide" onClick={onDiligence}><ShieldCheck size={16} /> Start diligence review</button>
        </aside>
      </div>
    </div>
  );
}

function Diligence({ founder }: { founder: FounderRecord | null }) {
  const [claimFilter, setClaimFilter] = useState("all");
  if (!founder) {
    return <div className="view"><div className="empty-state"><ShieldCheck size={24} /><strong>No founder selected</strong><p>Choose a founder before opening claims verification.</p></div></div>;
  }
  const claims = founder.trust_claims;
  const verified = claims.filter((claim) => claim.evidence_category === "known_verified" && !claim.contradiction_flag).length;
  const review = claims.length - verified;
  const meanConfidence = claims.length ? Math.round(claims.reduce((total, claim) => total + claim.confidence, 0) / claims.length * 100) : 0;
  const contradictions = claims.filter((claim) => claim.contradiction_flag).length;
  const memoReady = getMemoReady(founder);
  const evaluatedAt = formatFreshness(founder.timing.memo_ready_at);
  const filteredClaims = claims.filter((claim) => claimFilter === "all" || (claimFilter === "verified" ? claim.evidence_category === "known_verified" && !claim.contradiction_flag : claim.evidence_category !== "known_verified" || claim.contradiction_flag));
  return (
    <div className="view diligence-view">
      <div className="diligence-header">
        <div><span className="section-kicker"><ShieldCheck size={14} /> {founder.company_name} · Build: {labelize(founder.build_evidence.tier)}</span><h1>Trust claim verification</h1><p>Trace every extracted pitch claim to its evidence category and confidence.</p></div>
        <span className={`memo-readiness ${memoReady ? "ready" : "blocked"}`}>{memoReady ? <Check size={16} /> : <AlertTriangle size={16} />}{memoReady ? "Decision-ready memo" : "Memo blocked by evidence gaps"}</span>
      </div>
      <section className="diligence-summary">
        <article><span className="metric-icon green"><Check size={18} /></span><div><strong>{verified}</strong><small>Known verified claims</small></div></article>
        <article><span className="metric-icon orange"><Clock3 size={18} /></span><div><strong>{review}</strong><small>Claims needing review</small></div></article>
        <article><span className="metric-icon blue"><ShieldCheck size={18} /></span><div><strong>{meanConfidence}%</strong><small>Mean claim confidence</small></div></article>
        <article><span className="metric-icon violet"><Activity size={18} /></span><div><strong>{contradictions}</strong><small>Contradiction flags</small></div></article>
      </section>
      <div className="diligence-layout">
        <section className="claims-column">
          <div className="section-heading"><div><h2>Priority claims</h2><p>Ranked by impact on the investment case · {evaluatedAt}</p></div>{claims.length > 0 && <label className="select-control"><span className="sr-only">Filter claims</span><select value={claimFilter} onChange={(event) => setClaimFilter(event.target.value)}><option value="all">All claims</option><option value="review">Needs review</option><option value="verified">Verified</option></select><ChevronDown size={14} /></label>}</div>
          {filteredClaims.map((claim, index) => (
            <article className="claim-card" key={`${claim.claim_text}-${index}`}>
              <div className="claim-index">{String(index + 1).padStart(2, "0")}</div>
              <div className="claim-body">
                <div className="claim-title"><h3>{claim.claim_text}</h3><span className={claim.evidence_category === "known_verified" && !claim.contradiction_flag ? "verified" : "review"}>{claim.evidence_category === "known_verified" && !claim.contradiction_flag ? <Check size={13} /> : <Clock3 size={13} />}{labelize(claim.evidence_category)}</span></div>
                <p>{claim.contradiction_flag ? "Contradicting evidence was detected and this claim receives no trust credit." : "Confidence is calculated from the available source evidence."}</p>
                <div className="source-row"><span><FileCheck2 size={14} /> {claim.source || "No source citation"}</span><span><Globe2 size={14} /> {labelize(claim.evidence_category)}</span><span>{evaluatedAt}</span></div>
              </div>
              <div className="confidence-score"><strong>{Math.round(claim.confidence * 100)}%</strong><small>claim confidence</small></div>
            </article>
          ))}
          {!claims.length && <div className="empty-state blocking"><AlertTriangle size={24} /><strong>Claim extraction incomplete</strong><p>No reviewable claims were produced. This record cannot be marked diligence-complete or memo-ready.</p></div>}
        </section>
        <aside className="diligence-rail">
          <article className="panel">
            <div className="panel-heading"><div><h2>Independent axis scores</h2><p>Not averaged in this view</p></div></div>
            <ScoreBar label="Founder Axis" value={Math.round(founder.axis_scores.founder?.score || 0)} provenance={`Model-derived · ${evaluatedAt}`} /><ScoreBar label="Market Axis" value={Math.round(founder.axis_scores.market?.score || 0)} provenance={`Model-derived · ${evaluatedAt}`} /><ScoreBar label="Idea-vs-Market Axis" value={Math.round(founder.axis_scores.idea_vs_market?.score || 0)} provenance={`Model-derived · ${evaluatedAt}`} /><ScoreBar label="Entity Resolution Confidence" value={Math.round((founder.entity_resolution_confidence || 0) * 100)} provenance={`${founder.source_evidence.length} attached source records`} />
          </article>
          <article className={`panel decision-card ${memoReady ? "complete" : "blocked"}`}><span className="section-kicker"><Lightbulb size={14} /> Evidence gate</span><h2>{memoReady ? "Claim review complete." : !claims.length ? "Manual review required." : review ? `Review ${review} unresolved claim${review === 1 ? "" : "s"}.` : "Evidence requirements remain incomplete."}</h2><p>{founder.screened_out_reason || (memoReady ? `${founder.source_evidence.length} source evidence records support the verified claims.` : claims.length ? `${founder.source_evidence.length} source evidence records and ${founder.build_evidence.evidence_log.length} build checks are attached.` : "Claim extraction returned no reviewable records. Re-upload a clearer deck or add evidence through a new intake run.")}</p>{!memoReady && <Link className="secondary-button wide" href="/intake">Open pitch intake <ArrowRight size={14} /></Link>}</article>
        </aside>
      </div>
    </div>
  );
}

const scannerSources = [
  { id: "github", label: "GitHub", icon: Github },
  { id: "x", label: "X", icon: Activity },
  { id: "substack", label: "Substack", icon: BookOpen },
  { id: "devpost", label: "Devpost", icon: Zap },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
];

function SignalScanner({ onDataChanged }: { onDataChanged: () => void }) {
  const [query, setQuery] = useState("AI infrastructure");
  const [selected, setSelected] = useState(scannerSources.map((source) => source.id));
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "unavailable">("checking");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/health`, { signal: controller.signal })
      .then((response) => setApiStatus(response.ok ? "connected" : "unavailable"))
      .catch(() => setApiStatus("unavailable"));
    return () => controller.abort();
  }, []);

  const toggleSource = (source: string) => {
    setSelected((current) => current.includes(source) ? current.filter((item) => item !== source) : [...current, source]);
  };

  const runScan = async () => {
    if (!query.trim() || !selected.length) {
      setError("Enter a query and select at least one source.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/scanners/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, sources: selected, max_results: 8 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "Scanner run failed.");
      setSignals(data.signals ?? []);
      onDataChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The scanner API is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view workflow-view">
      <section className="workflow-hero">
        <div><span className="section-kicker"><Zap size={14} /> Stage 0 sourcing</span><h1>Find public founder signals.</h1><p>Run GitHub directly and search public X, Substack, Devpost, and LinkedIn pages through Tavily. Every result is source-tagged and persisted.</p></div>
        <span className={`api-status ${apiStatus}`}><i /> {apiStatus === "checking" ? "Checking API connection…" : apiStatus === "connected" ? "VC Brain API connected" : "VC Brain API unavailable"}</span>
      </section>
      <article className="panel workflow-panel">
        <label className="field-label">Thesis keyword, founder, or company</label>
        <div className="scanner-query">
          <label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. agent infrastructure, climate fintech" /></label>
          <button className="primary-button" onClick={runScan} disabled={loading}>{loading ? "Scanning…" : "Run scan"} <ArrowRight size={15} /></button>
        </div>
        <div className="source-selector">
          {scannerSources.map(({ id, label, icon: Icon }) => (
            <button key={id} aria-pressed={selected.includes(id)} className={selected.includes(id) ? "selected" : ""} onClick={() => toggleSource(id)}><Icon size={15} /> {label}{selected.includes(id) && <Check size={13} />}</button>
          ))}
        </div>
        {error && <p className="workflow-error">{error}</p>}
      </article>
      <div className="results-bar">
        <div><strong>{signals.length} persisted signals</strong><span> ranked by normalized signal score</span></div>
      </div>
      <section className="signal-results">
        {!signals.length && !loading && <div className="empty-state"><Search size={24} /><strong>No scan results yet</strong><p>Choose sources and run a query to populate the live signal feed.</p></div>}
        {signals.map((signal) => (
          <article className="panel signal-card" key={signal.signal_id}>
            <span className={`source-mark ${signal.source}`}>{signal.source === "github" ? <Github size={16} /> : signal.source === "linkedin" ? <Linkedin size={16} /> : <Globe2 size={16} />}</span>
            <div><div className="signal-title"><span>{signal.source}</span><strong>{Math.round(signal.score)} unreviewed relevance</strong></div><h2>{signal.title}</h2><p>{signal.summary || "Public source discovered without an extractable summary."}</p><small className="provenance-line">{formatFreshness(signal.observed_at, "Observed")} · Public source · Not yet accepted as company evidence</small><a href={signal.source_url} target="_blank" rel="noreferrer">Inspect source <ArrowRight size={13} /></a></div>
          </article>
        ))}
      </section>
    </div>
  );
}

function PitchIntake({ onCreated }: { onCreated: (founderId: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<FounderRecord | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setStatus("error");
      setMessage("Select a PDF, TXT, or Markdown pitch file.");
      return;
    }
    const form = new FormData(event.currentTarget);
    form.set("pitch", file);
    setStatus("loading");
    setMessage("");
    setResult(null);
    try {
      const response = await fetch(`${API_BASE}/founders/inbound/upload`, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "Pitch processing failed.");
      setResult(data);
      setStatus("success");
      setMessage("Founder created, enriched, analyzed, and saved.");
      onCreated(data.founder_id);
    } catch (reason) {
      setStatus("error");
      setMessage(reason instanceof Error ? reason.message : "The intake API is unavailable.");
    }
  };

  return (
    <div className="view workflow-view">
      <section className="workflow-hero">
        <div><span className="section-kicker"><Upload size={14} /> Inbound activation</span><h1>Turn a pitch into an investment record.</h1><p>Upload a pitch and minimal founder context. The backend extracts the deck, checks public LinkedIn evidence, runs the analysis pipeline, and persists the founder.</p></div>
      </section>
      <div className="intake-layout">
        <form className="panel intake-form" onSubmit={submit}>
          <div className="form-grid">
            <label><span>Founder name</span><input name="name" required maxLength={160} placeholder="Priya Nandakumar" /></label>
            <label><span>Company name</span><input name="company_name" required maxLength={200} placeholder="Ridgeline" /></label>
            <label><span>LinkedIn profile</span><input name="linkedin_url" type="url" placeholder="https://linkedin.com/in/…" /></label>
            <label><span>GitHub handle</span><input name="github_handle" placeholder="priyanandakumar" /></label>
            <label><span>Sector</span><input name="sector" placeholder="AI infrastructure" /></label>
            <label><span>Stage</span><input name="stage" placeholder="Seed" /></label>
            <label className="full-field"><span>Geography</span><input name="geography" placeholder="United States" /></label>
          </div>
          <label className={`upload-zone ${file ? "has-file" : ""}`}>
            <Upload size={25} /><strong>{file ? file.name : "Choose pitch deck"}</strong><span>PDF, TXT, or Markdown · maximum 10 MB</span>
            <input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </label>
          <button type="submit" className="primary-button wide intake-submit" disabled={status === "loading"}>{status === "loading" ? "Running intelligence pipeline…" : "Upload and analyze"} <ArrowRight size={15} /></button>
          {message && <p className={`workflow-message ${status}`}>{message}</p>}
        </form>
        <aside className="intake-rail">
          <article className="panel process-card"><span className="section-kicker"><Bot size={14} /> Processing path</span>{["Secure pitch extraction", "Founder & company creation", "Public LinkedIn evidence", "Entity and thesis analysis", "Score, memo, and persistence"].map((step, index) => <div key={step}><span>{index + 1}</span><p>{step}</p></div>)}</article>
          {result && <article className="panel result-card"><span className="metric-icon green"><Check size={18} /></span><small>Analysis complete</small><h2>{result.company_name}</h2><p>{result.name}</p><strong>{Math.round(result.founder_score.value)}<em>/100 Founder Score</em></strong><span>{result.source_evidence.filter((item) => item.source === "linkedin").length} LinkedIn evidence result(s)</span></article>}
        </aside>
      </div>
    </div>
  );
}

function SearchDialog({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (view: View) => void }) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && open) { event.preventDefault(); onClose(); }
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, open]);
  if (!open) return null;
  const suggestions = [
    { title: "Scan GitHub, X, Substack, Devpost, and LinkedIn", detail: "Live signal scanner", view: "scanner" as View },
    { title: "Upload a founder pitch deck", detail: "Inbound activation", view: "intake" as View },
    { title: "Find founders with strong GitHub momentum", detail: "Search Discovery", view: "discovery" as View },
    { title: "Open the selected founder record", detail: "Company analysis", view: "company" as View },
    { title: "Review unverified claims", detail: "Diligence workspace", view: "diligence" as View },
  ].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="search-dialog" role="dialog" aria-modal="true" aria-label="Quick actions" onMouseDown={(event) => event.stopPropagation()}>
        <label><Search size={20} /><input autoFocus placeholder="Find a workflow..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>ESC</kbd></label>
        <div className="dialog-content"><p className="eyebrow">Quick actions</p>{suggestions.map((item) => <button key={item.title} onClick={() => { onSelect(item.view); onClose(); }}><span><Zap size={16} /></span><div><strong>{item.title}</strong><small>{item.detail}</small></div><ArrowRight size={15} /></button>)}{!suggestions.length && <p className="inline-empty">No matching workflow. This menu navigates the product; it does not provide AI answers.</p>}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [founders, setFounders] = useState<FounderRecord[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [selectedFounderId, setSelectedFounderId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);

  const navigate = (nextView: View, founderId?: string | null) => {
    const resolvedFounderId = founderId ?? ((nextView === "company" || nextView === "diligence") ? selectedFounderId : null);
    window.history.pushState({}, "", urlForView(nextView, resolvedFounderId));
    setView(nextView);
    if (founderId !== undefined) setSelectedFounderId(founderId);
  };

  useEffect(() => {
    const syncFromLocation = () => {
      const locationState = viewFromLocation();
      setView(locationState.view);
      if (locationState.founderId) setSelectedFounderId(locationState.founderId);
    };
    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      setDataLoading(true);
      if (USE_MOCK_DATA) {
        setFounders(MOCK_FOUNDERS);
        setSignals(MOCK_SIGNALS);
        setSummary(MOCK_SUMMARY);
        setSelectedFounderId((current) => {
          const routeFounderId = viewFromLocation().founderId;
          const preferred = routeFounderId ?? current;
          if (routeFounderId) return MOCK_FOUNDERS.some((founder) => founder.founder_id === routeFounderId) ? routeFounderId : null;
          return preferred && MOCK_FOUNDERS.some((founder) => founder.founder_id === preferred) ? preferred : MOCK_FOUNDERS[0].founder_id;
        });
        setDataError("");
        setDataLoading(false);
        return;
      }
      try {
        const [foundersResponse, signalsResponse, summaryResponse] = await Promise.all([
          fetch(`${API_BASE}/founders`, { signal: controller.signal }),
          fetch(`${API_BASE}/signals?limit=8`, { signal: controller.signal }),
          fetch(`${API_BASE}/dashboard/summary`, { signal: controller.signal }),
        ]);
        if (!foundersResponse.ok || !signalsResponse.ok || !summaryResponse.ok) {
          throw new Error("The VC Brain API returned an error.");
        }
        const [founderData, signalData, summaryData] = await Promise.all([
          foundersResponse.json(),
          signalsResponse.json(),
          summaryResponse.json(),
        ]);
        setFounders(founderData);
        setSignals(signalData.signals ?? []);
        setSummary(summaryData);
        setSelectedFounderId((current) => {
          const routeFounderId = viewFromLocation().founderId;
          const preferred = routeFounderId ?? current;
          if (routeFounderId) return founderData.some((founder: FounderRecord) => founder.founder_id === routeFounderId) ? routeFounderId : null;
          return preferred && founderData.some((founder: FounderRecord) => founder.founder_id === preferred) ? preferred : founderData[0]?.founder_id ?? null;
        });
        setDataError("");
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setDataError(reason instanceof Error ? `${reason.message} Start FastAPI at ${API_BASE}.` : "The VC Brain API is unavailable.");
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
    return () => controller.abort();
  }, [refreshVersion]);

  const selectedFounder = founders.find((founder) => founder.founder_id === selectedFounderId) ?? null;
  const openFounder = (founderId: string) => {
    navigate("company", founderId);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <main className="app-shell">
      <Sidebar view={view} onView={(nextView) => navigate(nextView)} open={navOpen} onClose={() => setNavOpen(false)} reviewCount={summary.unverified_claims} />
      <div className="workspace">
        <Topbar view={view} onMenu={() => setNavOpen(true)} onSearch={() => setSearchOpen(true)} />
        {view === "dashboard" && <Dashboard onView={(nextView) => navigate(nextView)} onFounder={openFounder} founders={founders} signals={signals} summary={summary} loading={dataLoading} error={dataError} />}
        {view === "scanner" && <SignalScanner onDataChanged={() => setRefreshVersion((version) => version + 1)} />}
        {view === "intake" && <PitchIntake onCreated={(founderId) => { setRefreshVersion((version) => version + 1); navigate("company", founderId); }} />}
        {view === "discovery" && <Discovery founders={founders} onCompany={openFounder} />}
        {view === "company" && <Company founder={selectedFounder} onDiligence={() => navigate("diligence", selectedFounderId)} />}
        {view === "diligence" && <Diligence founder={selectedFounder} />}
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={(nextView) => navigate(nextView)} />
    </main>
  );
}
