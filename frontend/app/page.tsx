"use client";

import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileCheck2,
  FileText,
  Github,
  Globe2,
  Linkedin,
  LayoutDashboard,
  Lightbulb,
  MessageCircle,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  source_evidence: Array<{ source: string; title: string; url: string; content: string; confidence: number }>;
  memo: Record<string, unknown>;
  adversarial_view: Record<string, unknown>;
  timing: { elapsed_seconds: number | null; memo_ready_at: string | null; stage_timings: Record<string, number> };
};

type BriefingStep = {
  label: string;
  content: string;
  elapsed: number;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user" | "thinking";
  label?: string;
  content: string;
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

const API_BASE = process.env.NEXT_PUBLIC_VC_BRAIN_API_URL ?? "http://localhost:8000";

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
    source_evidence: [{ source: "linkedin", title: `${name} public profile`, url: "https://www.linkedin.com", content: `${name} lists ${company} as current role on their public LinkedIn profile.`, confidence: 0.9 }],
    memo: {
      company_snapshot: `${company} is a retained demo company in ${sector}, shown only when the mock-data feature flag is enabled.`,
      investment_hypotheses: ["Founder experience maps to the stated problem.", "Public build evidence supports execution velocity."],
    },
    adversarial_view: {
      bear_case_summary: "The retained mock case still requires customer and market validation.",
      key_risks: ["Customer and market validation for this demo fixture is still limited.", "Growth claims rely on a small set of mock evidence records."],
      unresolved_red_flags: ["No independently verified financial data is attached to this fixture."],
      what_would_change_my_mind: "Independent corroboration of the underlying growth and retention claims.",
    },
    timing: { elapsed_seconds: 14.2, memo_ready_at: "2026-07-14T12:00:14Z", stage_timings: { entity_resolution: 0.4, scoring: 8.1, memo: 5.7 } },
  };
}

// Retained demo fixtures. Always merged on top of the persisted API
// founders so the workspace never looks empty before real records exist.
const MOCK_FOUNDERS: FounderRecord[] = [
  createMockFounder({ id: "mock-priya", name: "Priya Nandakumar", company: "Ridgeline", sector: "Developer tools", stage: "Seed", score: 92, confidence: 0.92, trend: "improving" }),
  createMockFounder({ id: "mock-marcus", name: "Marcus Ihediwa", company: "Ledgerly", sector: "Embedded finance", stage: "Pre-seed", score: 84, confidence: 0.81, trend: "improving" }),
  createMockFounder({ id: "mock-alina", name: "Alina Moroz", company: "NeuroStream", sector: "Healthcare AI", stage: "Series A", score: 88, confidence: 0.87, trend: "improving" }),
  createMockFounder({ id: "mock-julian", name: "Julian Vance", company: "Conduit Labs", sector: "Climate infrastructure", stage: "Seed", score: 79, confidence: 0.76, trend: "stable" }),
  createMockFounder({ id: "mock-sana", name: "Sana Jenkins", company: "Fieldnote", sector: "Vertical SaaS", stage: "Pre-seed", score: 76, confidence: 0.73, trend: "improving" }),
  createMockFounder({ id: "mock-leo", name: "Leo Chen", company: "Onward Robotics", sector: "Robotics", stage: "Seed", score: 81, confidence: 0.79, trend: "stable" }),
];

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
          <p className="eyebrow nav-section">Library</p>
          <button className="nav-item"><BookOpen size={17} /><span>Thesis Library</span></button>
          <button className="nav-item"><FileText size={17} /><span>Investment Memos</span></button>
          <button className="nav-item"><Users size={17} /><span>Network</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button className="primary-button wide"><Sparkles size={16} /> Generate memo</button>
          <button className="nav-item"><CircleHelp size={17} /><span>Help & resources</span></button>
          <button className="nav-item"><Settings size={17} /><span>Settings</span></button>
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
        <Search size={15} /><span>Ask anything about your pipeline...</span><kbd>⌘ K</kbd>
      </button>
      <div className="top-actions">
        <button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button>
        <span className="avatar blue small">AK</span>
      </div>
    </header>
  );
}

function MetricCard({ icon: Icon, label, value, meta, tone }: { icon: typeof Activity; label: string; value: string; meta: string; tone: string }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon size={18} /></div>
      <div><p>{label}</p><strong>{value}</strong><small>{meta}</small></div>
      <TrendingUp size={17} className="up" />
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
          <p>Your pipeline contains <strong>{summary.active_opportunities} active opportunities</strong> and {summary.raw_signals} raw sourcing signals.</p>
        </div>
        <div className="hero-actions">
          <button className="secondary-button" onClick={() => onView("intake")}><Plus size={16} /> Add company</button>
          <button className="primary-button" onClick={() => onView("scanner")}><Search size={16} /> Scan live signals</button>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Workflow metrics">
        <MetricCard icon={Users} label="Founder records" value={String(summary.founder_records)} meta={`${summary.active_opportunities} active opportunities`} tone="blue" />
        <MetricCard icon={Zap} label="Raw signals" value={String(summary.raw_signals)} meta="Persisted Stage 0 evidence" tone="violet" />
        <MetricCard icon={ShieldCheck} label="High-confidence scores" value={String(summary.high_confidence_scores)} meta={`Average confidence ${Math.round(summary.average_score_confidence * 100)}%`} tone="green" />
        <MetricCard icon={FileCheck2} label="Memo ready" value={String(summary.memo_ready)} meta={`${summary.unverified_claims} unverified claims`} tone="orange" />
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
                <span className="founder-copy"><strong>{founder.company_name}</strong><small>{founder.name} · {labelize(String(founder.raw_inputs.sector || founder.source_channel))}</small></span>
                <span className="signal-tag">{labelize(founder.founder_score.trend)}</span>
                <span className="score-badge"><strong>{Math.round(founder.founder_score.value)}</strong><small>/100</small></span>
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
              <div className="feed-item" key={signal.signal_id}><span className={`feed-icon ${signal.source === "github" ? "github" : "web"}`}>{signal.source === "github" ? <Github size={15} /> : <Globe2 size={15} />}</span><div><strong>{signal.title}</strong><p>{signal.summary || "No public excerpt was returned."}</p><small>{labelize(signal.source)} · score {Math.round(signal.score)}</small></div></div>
            ))}
            {!signals.length && <div className="inline-empty">Run the Signal Scanner to persist raw sourcing evidence.</div>}
          </div>
        </article>

        <article className="panel momentum-panel">
          <div className="panel-heading">
            <div><h2>Score distribution</h2><p>Founder Score across ranked opportunities</p></div>
            <button className="select-button">Persisted records <ChevronDown size={14} /></button>
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
  const filtered = useMemo(() => founders.filter((founder) => `${founder.name} ${founder.company_name} ${String(founder.raw_inputs.sector || "")}`.toLowerCase().includes(query.toLowerCase())), [founders, query]);
  return (
    <div className="view discovery-view">
      <section className="discovery-hero">
        <span className="section-kicker"><Target size={14} /> Founder discovery</span>
        <h1>Discover your next big founder.</h1>
        <p>Search persisted founder records ranked by Founder Score and evidence confidence.</p>
        <label className="big-search">
          <Search size={19} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “AI infrastructure founders at Seed in the US”" />
          <button aria-label="Search"><ArrowRight size={18} /></button>
        </label>
        <div className="quick-searches">
          <span>Explore:</span><button>Repeat founders</button><button>Developer tools</button><button>Healthcare AI</button><button>Strong GitHub signal</button>
        </div>
      </section>
      <div className="results-bar">
        <div><strong>{filtered.length} founder records</strong><span> ranked by Founder Score</span></div>
        <div className="filter-actions"><button className="select-button">Stage <ChevronDown size={14} /></button><button className="select-button">Sector <ChevronDown size={14} /></button><button className="select-button">Sort: Best fit <ChevronDown size={14} /></button></div>
      </div>
      <section className="founder-grid">
        {filtered.map((founder) => (
          <article className="founder-card" key={founder.founder_id}>
            <div className="founder-card-top"><Avatar founder={founder} /><span className="fit-pill">{Math.round(founder.founder_score.confidence * 100)}% confidence</span></div>
            <h2>{founder.name}</h2><p className="company-line">{founder.company_name} <span>·</span> {labelize(String(founder.raw_inputs.stage || founder.source_channel))}</p>
            <p className="founder-summary">{founder.axis_scores.founder?.rationale || founder.screened_out_reason || "Analysis is available from the persisted founder record."}</p>
            <div className="evidence-chips"><span><ShieldCheck size={13} /> {labelize(founder.build_evidence.tier)}</span><span><TrendingUp size={13} /> {labelize(founder.founder_score.trend)}</span></div>
            <div className="card-score"><span><small>Founder Score</small><strong>{Math.round(founder.founder_score.value)}<em>/100</em></strong></span><div className="mini-ring" style={{ "--score": `${founder.founder_score.value * 3.6}deg` } as React.CSSProperties}><span>{Math.round(founder.founder_score.value)}</span></div></div>
            <div className="card-actions"><button className="secondary-button">{labelize(founder.source_channel)}</button><button className="primary-button" onClick={() => onCompany(founder.founder_id)}>Open analysis <ArrowRight size={14} /></button></div>
          </article>
        ))}
        {!filtered.length && <div className="empty-state"><Users size={24} /><strong>No matching founder records</strong><p>Submit a pitch or adjust the search query.</p></div>}
      </section>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return <div className="score-line"><div><span>{label}</span><strong>{value}</strong></div><div className="progress"><i style={{ width: `${value}%` }} /></div></div>;
}

type ReasoningStatus = "positive" | "caution" | "critical";

type ReasoningStep = {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  status: ReasoningStatus;
  summary: string;
  elapsed: string | null;
  content: React.ReactNode;
};

function ReasoningTrail({ founder }: { founder: FounderRecord }) {
  const [openStep, setOpenStep] = useState<string | null>("trust_score");
  const stageTime = (key: string) => founder.timing.stage_timings[key];
  const formatSeconds = (seconds: number | undefined): string | null =>
    typeof seconds === "number" ? `${seconds.toFixed(1)}s` : null;

  const axisMeta: Array<{ id: string; title: string; key: string }> = [
    { id: "founder_axis_scoring", title: "Founder axis", key: "founder" },
    { id: "market_axis_scoring", title: "Market axis", key: "market" },
    { id: "idea_vs_market_scoring", title: "Idea-vs-market axis", key: "idea_vs_market" },
  ];
  const axisSteps: ReasoningStep[] = axisMeta.map(({ id, title, key }) => {
    const score = founder.axis_scores[key];
    const status: ReasoningStatus = !score ? "caution" : score.score >= 65 ? "positive" : score.score >= 40 ? "caution" : "critical";
    return {
      id,
      title,
      icon: Sparkles,
      status,
      summary: score
        ? `${labelize(score.rating)} · ${Math.round(score.score)}/100 · ${labelize(score.trend)} trend`
        : "No independent score was produced for this axis.",
      elapsed: formatSeconds(stageTime(id)),
      content: <p className="reasoning-note">{score?.rationale || "No rationale was recorded for this axis."}</p>,
    };
  });

  const steps: ReasoningStep[] = [
    {
      id: "entity_resolution",
      title: "Entity resolution",
      icon: Users,
      status: (founder.entity_resolution_confidence ?? 0) >= 0.6 ? "positive" : "caution",
      summary:
        founder.entity_resolution_confidence === null
          ? "No external identity match was found before scoring began."
          : `Matched founder identity at ${Math.round(founder.entity_resolution_confidence * 100)}% confidence from public source evidence.`,
      elapsed: formatSeconds(stageTime("entity_resolution")),
      content: (
        <div className="citation-list">
          {founder.source_evidence.length ? (
            founder.source_evidence.map((item, index) => (
              <a className="citation-card" key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer">
                <span className="citation-tag">{labelize(item.source)}</span>
                <strong>{item.title}</strong>
                <p>
                  {(item.content || "No excerpt captured.").slice(0, 170)}
                  {(item.content || "").length > 170 ? "…" : ""}
                </p>
                <span className="citation-meta">{Math.round(item.confidence * 100)}% confidence <ArrowRight size={11} /></span>
              </a>
            ))
          ) : (
            <div className="inline-empty">No public web signal was collected for this founder.</div>
          )}
        </div>
      ),
    },
    {
      id: "thesis_matching",
      title: "Thesis screening",
      icon: Target,
      status: founder.screened_out ? "critical" : "positive",
      summary: founder.screened_out
        ? founder.screened_out_reason || "Screened out of the fund thesis."
        : "Sector, stage, and geography matched the fund's thesis.",
      elapsed: formatSeconds(stageTime("thesis_matching")),
      content: (
        <p className="reasoning-note">
          {founder.screened_out_reason || "This record fell inside the configured thesis and proceeded to full scoring."}
        </p>
      ),
    },
    ...axisSteps,
    {
      id: "build_evidence",
      title: "Build evidence",
      icon: FileCheck2,
      status:
        founder.build_evidence.tier === "verified_working"
          ? "positive"
          : founder.build_evidence.tier === "unverifiable"
          ? "critical"
          : "caution",
      summary: `${labelize(founder.build_evidence.tier)} · ${founder.build_evidence.evidence_log.length} signal${founder.build_evidence.evidence_log.length === 1 ? "" : "s"} checked`,
      elapsed: formatSeconds(stageTime("build_evidence")),
      content: (
        <div className="citation-list">
          {founder.build_evidence.evidence_log.length ? (
            founder.build_evidence.evidence_log.map((entry, index) => (
              <div className={`citation-card ${entry.found ? "positive" : "caution"}`} key={`${entry.signal}-${index}`}>
                <span className={`citation-tag ${entry.found ? "found" : "missing"}`}>
                  {entry.found ? <Check size={10} /> : <X size={10} />} {labelize(entry.signal)}
                </span>
                <p>{entry.detail}</p>
                {entry.source_url && (
                  <a href={entry.source_url} target="_blank" rel="noreferrer" className="citation-meta">
                    View signal <ArrowRight size={11} />
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="inline-empty">No build-verification signals were checked.</div>
          )}
        </div>
      ),
    },
    {
      id: "trust_score",
      title: "Trust claims",
      icon: ShieldCheck,
      status: founder.trust_claims.some((claim) => claim.contradiction_flag)
        ? "critical"
        : founder.trust_claims.length && founder.trust_claims.every((claim) => claim.evidence_category === "known_verified")
        ? "positive"
        : "caution",
      summary: `${founder.trust_claims.length} claim${founder.trust_claims.length === 1 ? "" : "s"} extracted from the pitch and checked against public evidence`,
      elapsed: formatSeconds(stageTime("trust_score")),
      content: (
        <div className="citation-list">
          {founder.trust_claims.length ? (
            founder.trust_claims.map((claim, index) => (
              <div
                className={`citation-card ${claim.contradiction_flag ? "critical" : claim.evidence_category === "known_verified" ? "positive" : "caution"}`}
                key={`${claim.claim_text}-${index}`}
              >
                <span className="citation-tag">
                  {labelize(claim.evidence_category)}
                  {claim.contradiction_flag ? " · contradicted" : ""}
                </span>
                <p className="citation-quote">&ldquo;{claim.claim_text}&rdquo;</p>
                <div className="citation-footer">
                  <span>{Math.round(claim.confidence * 100)}% confidence</span>
                  {claim.source ? (
                    <a href={claim.source} target="_blank" rel="noreferrer">Cited source <ArrowRight size={11} /></a>
                  ) : (
                    <span className="muted">No source citation</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="inline-empty">No claims were extracted from the pitch deck.</div>
          )}
        </div>
      ),
    },
    {
      id: "founder_score",
      title: "Founder Score",
      icon: TrendingUp,
      status: founder.founder_score.confidence >= 0.7 ? "positive" : founder.founder_score.confidence >= 0.4 ? "caution" : "critical",
      summary: `${Math.round(founder.founder_score.value)}/100 · ${Math.round(founder.founder_score.confidence * 100)}% confidence, weighted from every step above`,
      elapsed: null,
      content: (
        <p className="reasoning-note">
          {founder.founder_score.confidence_basis ||
            "Weighted from entity resolution, both independent axis scores, build evidence, and trust claim confidence."}
        </p>
      ),
    },
  ];

  return (
    <article className="panel reasoning-trail">
      <div className="panel-heading">
        <div>
          <span className="section-kicker"><Lightbulb size={14} /> Chain of thought</span>
          <h2>Evidence &amp; reasoning trail</h2>
          <p>Every step that produced this Trust Score, with the exact citation behind it</p>
        </div>
      </div>
      <div className="trail-list">
        {steps.map((step) => {
          const Icon = step.icon;
          const isOpen = openStep === step.id;
          return (
            <div className={`trail-step ${step.status} ${isOpen ? "open" : ""}`} key={step.id}>
              <button className="trail-step-header" onClick={() => setOpenStep(isOpen ? null : step.id)} aria-expanded={isOpen}>
                <span className="trail-dot" />
                <span className="trail-icon"><Icon size={14} /></span>
                <span className="trail-copy"><strong>{step.title}</strong><small>{step.summary}</small></span>
                {step.elapsed && <span className="trail-time"><Clock3 size={11} /> {step.elapsed}</span>}
                <ChevronDown size={14} className="trail-chevron" />
              </button>
              {isOpen && <div className="trail-step-body">{step.content}</div>}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function Company({ founder, onDiligence, onOpenChat }: { founder: FounderRecord | null; onDiligence: () => void; onOpenChat: () => void }) {
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
  return (
    <div className="view company-view">
      <div className="company-header">
        <div className="company-identity"><span className="company-logo">{founder.company_name[0]?.toUpperCase()}</span><div><span className="section-kicker">{labelize(String(founder.raw_inputs.sector || "Unclassified"))} · {labelize(String(founder.raw_inputs.stage || founder.source_channel))}</span><h1>{founder.company_name}</h1><p>{founder.name} · {labelize(founder.founder_score.trend)} Founder Score trend</p></div></div>
        <div className="hero-actions"><button className="secondary-button"><Globe2 size={16} /> {founder.source_evidence.length} source evidence</button><button className="secondary-button" onClick={onOpenChat}><MessageCircle size={16} /> Ask about this company</button><button className="primary-button" onClick={onDiligence}><ShieldCheck size={16} /> Open claims verification</button></div>
      </div>
      <div className="company-layout">
        <div className="company-main">
          <article className="panel executive-card">
            <div className="panel-heading"><div><span className="section-kicker"><Bot size={14} /> Investment memo</span><h2>Company snapshot</h2></div><span className="confidence-pill"><Check size={13} /> {Math.round(founder.founder_score.confidence * 100)}% score confidence</span></div>
            <p>{memoSnapshot}</p>
            <div className="summary-tags"><span>{labelize(founder.build_evidence.tier)}</span><span>{founder.trust_claims.length} trust claims</span><span>{founder.source_evidence.length} source evidence</span>{founder.screened_out && <span className="warning">Screened out</span>}</div>
          </article>
          <section className="company-stats">
            <article className="panel stat-box"><small>Founder Score</small><strong>{formatMetric(founder.founder_score.value)}</strong><span className="positive">{labelize(founder.founder_score.trend)}</span></article>
            <article className="panel stat-box"><small>Score Confidence</small><strong>{Math.round(founder.founder_score.confidence * 100)}%</strong><span>{labelize(founder.founder_score.confidence_basis || "track record")}</span></article>
            <article className="panel stat-box"><small>Signal → Memo</small><strong>{formatMetric(founder.timing.elapsed_seconds, "s")}</strong><span>{Object.keys(founder.timing.stage_timings).length} timed pipeline stages</span></article>
          </section>
          <article className="panel">
            <div className="panel-heading"><div><h2>Why this could win</h2><p>Evidence-backed investment hypotheses</p></div><button className="text-button">View sources <ArrowRight size={14} /></button></div>
            <div className="hypothesis-list">{hypotheses.map((hypothesis, index) => <div key={hypothesis}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>Investment hypothesis</strong><p>{hypothesis}</p></div></div>)}{!hypotheses.length && <div className="inline-empty">No investment hypotheses were generated.</div>}</div>
          </article>
          <ReasoningTrail founder={founder} />
          <article className="panel team-panel">
            <div className="panel-heading"><div><h2>Founder identity</h2><p>Entity resolution and source coverage</p></div></div>
            <div className="team-grid"><div><Avatar founder={founder} /><strong>{founder.name}</strong><small>{founder.entity_resolution_confidence === null ? "No external identity match" : `${Math.round(founder.entity_resolution_confidence * 100)}% entity resolution confidence`}</small></div><div><span className="avatar cyan">{founder.source_evidence.length}</span><strong>Source evidence</strong><small>{founder.source_evidence.map((item) => labelize(item.source)).join(", ") || "None collected"}</small></div></div>
          </article>
        </div>
        <aside className="company-rail">
          <article className="panel overall-score"><span className="mini-ring large" style={{ "--score": `${founder.founder_score.value * 3.6}deg` } as React.CSSProperties}><strong>{Math.round(founder.founder_score.value)}</strong><small>/100</small></span><div><span>Founder Score</span><strong>{labelize(founder.founder_score.trend)}</strong><small>{Math.round(founder.founder_score.confidence * 100)}% confidence</small></div></article>
          <article className="panel scorecard"><div className="panel-heading"><div><h2>Independent axis scores</h2></div></div><ScoreBar label="Founder Axis" value={Math.round(founder.axis_scores.founder?.score || 0)} /><ScoreBar label="Market Axis" value={Math.round(founder.axis_scores.market?.score || 0)} /><ScoreBar label="Idea-vs-Market Axis" value={Math.round(founder.axis_scores.idea_vs_market?.score || 0)} /><ScoreBar label="Trust Claim Confidence" value={trustConfidence} /></article>
          <article className="panel watch-card"><div className="panel-heading"><div><h2>Unverified or contradicted claims</h2></div><span>{watchItems.length}</span></div>{watchItems.slice(0, 4).map((claim) => <p key={claim.claim_text}><i className={claim.contradiction_flag ? "high" : "medium"} /> {claim.claim_text}</p>)}{!watchItems.length && <p><i className="low" /> No unresolved trust claims</p>}</article>
          <button className="primary-button wide" onClick={onDiligence}><ShieldCheck size={16} /> Start diligence review</button>
        </aside>
      </div>
    </div>
  );
}

function Diligence({ founder }: { founder: FounderRecord | null }) {
  if (!founder) {
    return <div className="view"><div className="empty-state"><ShieldCheck size={24} /><strong>No founder selected</strong><p>Choose a founder before opening claims verification.</p></div></div>;
  }
  const claims = founder.trust_claims;
  const verified = claims.filter((claim) => claim.evidence_category === "known_verified" && !claim.contradiction_flag).length;
  const review = claims.length - verified;
  const meanConfidence = claims.length ? Math.round(claims.reduce((total, claim) => total + claim.confidence, 0) / claims.length * 100) : 0;
  const contradictions = claims.filter((claim) => claim.contradiction_flag).length;
  return (
    <div className="view diligence-view">
      <div className="diligence-header">
        <div><span className="section-kicker"><ShieldCheck size={14} /> {founder.company_name} · {labelize(founder.build_evidence.tier)}</span><h1>Trust claim verification</h1><p>Trace every extracted pitch claim to its evidence category and confidence.</p></div>
        <button className="primary-button"><FileText size={16} /> Investment memo ready</button>
      </div>
      <section className="diligence-summary">
        <article><span className="metric-icon green"><Check size={18} /></span><div><strong>{verified}</strong><small>Known verified claims</small></div></article>
        <article><span className="metric-icon orange"><Clock3 size={18} /></span><div><strong>{review}</strong><small>Claims needing review</small></div></article>
        <article><span className="metric-icon blue"><ShieldCheck size={18} /></span><div><strong>{meanConfidence}%</strong><small>Mean claim confidence</small></div></article>
        <article><span className="metric-icon violet"><Activity size={18} /></span><div><strong>{contradictions}</strong><small>Contradiction flags</small></div></article>
      </section>
      <div className="diligence-layout">
        <section className="claims-column">
          <div className="section-heading"><div><h2>Priority claims</h2><p>Ranked by impact on the investment case</p></div><button className="select-button">All claims <ChevronDown size={14} /></button></div>
          {claims.map((claim, index) => (
            <article className="claim-card" key={`${claim.claim_text}-${index}`}>
              <div className="claim-index">{String(index + 1).padStart(2, "0")}</div>
              <div className="claim-body">
                <div className="claim-title"><h3>{claim.claim_text}</h3><span className={claim.evidence_category === "known_verified" && !claim.contradiction_flag ? "verified" : "review"}>{claim.evidence_category === "known_verified" && !claim.contradiction_flag ? <Check size={13} /> : <Clock3 size={13} />}{labelize(claim.evidence_category)}</span></div>
                <p>{claim.contradiction_flag ? "Contradicting evidence was detected and this claim receives no trust credit." : "Confidence is calculated from the available source evidence."}</p>
                <div className="source-row"><span><FileCheck2 size={14} /> {claim.source || "No source citation"}</span><span><Globe2 size={14} /> {labelize(claim.evidence_category)}</span></div>
              </div>
              <div className="confidence-score"><strong>{Math.round(claim.confidence * 100)}%</strong><small>claim confidence</small></div>
            </article>
          ))}
          {!claims.length && <div className="empty-state"><FileCheck2 size={24} /><strong>No trust claims extracted</strong><p>The pitch did not produce claim-level evidence records.</p></div>}
        </section>
        <aside className="diligence-rail">
          <article className="panel">
            <div className="panel-heading"><div><h2>Independent axis scores</h2><p>Not averaged in this view</p></div></div>
            <ScoreBar label="Founder Axis" value={Math.round(founder.axis_scores.founder?.score || 0)} /><ScoreBar label="Market Axis" value={Math.round(founder.axis_scores.market?.score || 0)} /><ScoreBar label="Idea-vs-Market Axis" value={Math.round(founder.axis_scores.idea_vs_market?.score || 0)} /><ScoreBar label="Entity Resolution Confidence" value={Math.round((founder.entity_resolution_confidence || 0) * 100)} />
          </article>
          <article className="panel decision-card"><span className="section-kicker"><Lightbulb size={14} /> Evidence gap</span><h2>{review ? `Review ${review} unresolved claim${review === 1 ? "" : "s"}.` : "Claim review complete."}</h2><p>{founder.screened_out_reason || `${founder.source_evidence.length} source evidence records and ${founder.build_evidence.evidence_log.length} build checks are attached.`}</p><button className="secondary-button wide">Add diligence task <Plus size={14} /></button></article>
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
        <span className="api-status"><i /> Connected to VC Brain API</span>
      </section>
      <article className="panel workflow-panel">
        <label className="field-label">Thesis keyword, founder, or company</label>
        <div className="scanner-query">
          <label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. agent infrastructure, climate fintech" /></label>
          <button className="primary-button" onClick={runScan} disabled={loading}>{loading ? "Scanning…" : "Run scan"} <ArrowRight size={15} /></button>
        </div>
        <div className="source-selector">
          {scannerSources.map(({ id, label, icon: Icon }) => (
            <button key={id} className={selected.includes(id) ? "selected" : ""} onClick={() => toggleSource(id)}><Icon size={15} /> {label}{selected.includes(id) && <Check size={13} />}</button>
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
            <div><div className="signal-title"><span>{signal.source}</span><strong>{Math.round(signal.score)} signal score</strong></div><h2>{signal.title}</h2><p>{signal.summary || "Public source discovered without an extractable summary."}</p><a href={signal.source_url} target="_blank" rel="noreferrer">Inspect source <ArrowRight size={13} /></a></div>
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
          <button className="primary-button wide intake-submit" disabled={status === "loading"}>{status === "loading" ? "Running intelligence pipeline…" : "Upload and analyze"} <ArrowRight size={15} /></button>
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
      <div className="search-dialog" role="dialog" aria-modal="true" aria-label="Search The VC Brain" onMouseDown={(event) => event.stopPropagation()}>
        <label><Search size={20} /><input autoFocus placeholder="Ask The VC Brain anything..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>ESC</kbd></label>
        <div className="dialog-content"><p className="eyebrow">Suggested</p>{suggestions.map((item) => <button key={item.title} onClick={() => { onSelect(item.view); onClose(); }}><span><Sparkles size={16} /></span><div><strong>{item.title}</strong><small>{item.detail}</small></div><ArrowRight size={15} /></button>)}</div>
      </div>
    </div>
  );
}

function isMockFounder(founder: FounderRecord) {
  return founder.founder_id.startsWith("mock-");
}

// Retained demo fixtures have no persisted backend record for the live
// multi-reasoning agent to run against, so the chat box falls back to this
// deterministic, client-side digest of the same fixture fields (memo,
// adversarial_view, axis_scores, trust_claims) — same 4-pass shape, same
// "never give a yes/no verdict" rule, just composed locally instead of via
// the backend agent.
function generateLocalBriefing(founder: FounderRecord): BriefingStep[] {
  const axisBits = Object.entries(founder.axis_scores)
    .map(([name, axis]) => `${labelize(name)} ${Math.round(axis.score)}/100`)
    .join(", ");
  const hypotheses = Array.isArray(founder.memo.investment_hypotheses)
    ? (founder.memo.investment_hypotheses as unknown[]).filter((item): item is string => typeof item === "string")
    : [];
  const adversarial = founder.adversarial_view as { bear_case_summary?: string; key_risks?: string[] };
  const risks = Array.isArray(adversarial.key_risks) ? adversarial.key_risks : [];

  return [
    {
      label: "Reading the evidence",
      content: `${founder.company_name} has ${founder.trust_claims.length} trust claim(s) on file, a build-evidence status of "${labelize(founder.build_evidence.tier)}", and ${axisBits || "no axis scores yet"}.`,
      elapsed: 0.4,
    },
    {
      label: "Weighing the upside",
      content: hypotheses.length ? hypotheses.join(" ") : "No strong bull-case hypotheses are on file for this company.",
      elapsed: 0.5,
    },
    {
      label: "Weighing the risks",
      content: risks.length ? risks.join(" ") : adversarial.bear_case_summary || "No major risks are currently flagged for this company.",
      elapsed: 0.5,
    },
    {
      label: "Plain-English summary",
      content: `${founder.company_name} currently scores ${Math.round(founder.founder_score.value)}/100 with ${Math.round(founder.founder_score.confidence * 100)}% confidence (${labelize(founder.founder_score.trend)} trend). ${
        hypotheses[0] ?? ""
      } At the same time, ${(risks[0] ?? adversarial.bear_case_summary ?? "some evidence remains unverified").toLowerCase()} This is a plain-English digest of the fixture data — the investment call is still yours to make.`,
      elapsed: 0.3,
    },
  ];
}

function answerLocalFollowup(founder: FounderRecord, question: string): string {
  const lower = question.toLowerCase();
  if (lower.includes("invest") || lower.includes("recommend") || lower.includes("should i")) {
    return `I don't give yes/no investment recommendations — that call is yours. Based on the fixture data, ${founder.company_name} scores ${Math.round(founder.founder_score.value)}/100 with ${Math.round(founder.founder_score.confidence * 100)}% confidence; weigh that against the risks above.`;
  }
  return `Based on the retained demo fixture for ${founder.company_name}: ${(founder.memo.company_snapshot as string) || "no further detail is on file for this mock record."}`;
}

function InvestorChat({
  founder,
  open,
  onOpenChange,
}: {
  founder: FounderRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [briefingSteps, setBriefingSteps] = useState<BriefingStep[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Note: this component is remounted (via a `key={founder.founder_id}` at
  // the call site) whenever the investor switches founders, so all state
  // above starts fresh without needing a reset effect here.

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const pushThinking = (label: string) => {
    const id = `thinking-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((current) => [...current, { id, role: "thinking", label, content: "" }]);
    return id;
  };

  const resolveThinking = (id: string, label: string, content: string) => {
    setMessages((current) => current.map((message) => (message.id === id ? { id, role: "assistant", label, content } : message)));
  };

  const revealSteps = async (steps: BriefingStep[]) => {
    // Reveal each reasoning pass one at a time, so the multi-step chain is
    // visibly "thinking" rather than dumping the whole answer at once.
    for (const step of steps) {
      const thinkingId = pushThinking(step.label);
      await sleep(500);
      resolveThinking(thinkingId, step.label, step.content);
      await sleep(200);
    }
  };

  const runBriefing = async () => {
    if (!founder) return;

    if (isMockFounder(founder)) {
      // Retained demo fixtures have no persisted backend record for the
      // live agent to run against — fall back to a client-side digest of
      // the same fixture data rather than blocking the chat entirely.
      setStatus("loading");
      setErrorMessage("");
      const steps = generateLocalBriefing(founder);
      setBriefingSteps(steps);
      await revealSteps(steps);
      setStatus("ready");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    try {
      const response = await fetch(`${API_BASE}/founders/${founder.founder_id}/investor-briefing`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "The investor briefing agent failed.");
      const steps: BriefingStep[] = data.steps ?? [];
      setBriefingSteps(steps);
      await revealSteps(steps);
      setStatus("ready");
    } catch (reason) {
      setStatus("error");
      setErrorMessage(reason instanceof Error ? reason.message : "The investor chat API is unavailable.");
    }
  };

  useEffect(() => {
    if (open && founder && status === "idle") {
      // Deferred to a microtask so the effect body itself stays synchronous
      // (runBriefing's first line sets state, which must not happen inline
      // within the effect callback).
      void Promise.resolve().then(() => runBriefing());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, founder]);

  const sendMessage = async () => {
    if (!founder || !input.trim() || sending) return;
    const question = input.trim();
    setInput("");
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", content: question }]);
    setSending(true);
    const thinkingId = pushThinking("Thinking it through");

    if (isMockFounder(founder)) {
      await sleep(500);
      resolveThinking(thinkingId, "Reply", answerLocalFollowup(founder, question));
      setSending(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/founders/${founder.founder_id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, briefing_steps: briefingSteps }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "The chat reply failed.");
      resolveThinking(thinkingId, "Reply", data.reply);
    } catch (reason) {
      resolveThinking(thinkingId, "Reply", reason instanceof Error ? reason.message : "The investor chat API is unavailable.");
    } finally {
      setSending(false);
    }
  };

  if (!founder) return null;

  return (
    <>
      <button className={`chat-fab ${open ? "open" : ""}`} onClick={() => onOpenChange(!open)} aria-label={open ? "Close investor chat" : "Ask The VC Brain about this company"}>
        {open ? <X size={20} /> : <Bot size={20} />}
      </button>
      {open && (
        <div className="chat-panel" role="dialog" aria-label={`Investor chat about ${founder.company_name}`}>
          <div className="chat-header">
            <div>
              <span className="section-kicker"><Sparkles size={12} /> Multi-step reasoning agent</span>
              <strong>{founder.company_name}</strong>
            </div>
            <button className="icon-button" onClick={() => onOpenChange(false)} aria-label="Close chat"><X size={16} /></button>
          </div>
          <div className="chat-body" ref={bodyRef}>
            {status === "loading" && !messages.length && <div className="inline-empty">Reading the evidence…</div>}
            {messages.map((message) => (
              <div className={`chat-bubble ${message.role}`} key={message.id}>
                {message.role !== "user" && message.label && <span className="chat-bubble-label">{message.label}</span>}
                {message.role === "thinking" ? (
                  <span className="typing-dots"><i /><i /><i /></span>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            ))}
            {status === "error" && <div className="chat-error">{errorMessage}</div>}
            {status === "ready" && (
              <p className="chat-disclaimer">
                {isMockFounder(founder)
                  ? "Retained demo fixture — this digest is composed client-side from the mock record, not a live agent call. Submit a pitch or run the signal scanner for a real founder."
                  : "This is a plain-English digest of the scores, evidence, and confidence already on record — not an investment recommendation."}
              </p>
            )}
          </div>
          <form
            className="chat-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={status === "ready" ? "Ask a follow-up question…" : "Waiting for the briefing…"}
              disabled={status !== "ready" || sending}
            />
            <button type="submit" className="icon-button" disabled={status !== "ready" || sending || !input.trim()} aria-label="Send message">
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}
    </>
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
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      setDataLoading(true);
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
        // Always show the retained demo fixtures alongside whatever is
        // actually persisted (including founders just added via Pitch
        // Intake), ranked together by Founder Score.
        const merged = [...MOCK_FOUNDERS, ...founderData].sort(
          (a: FounderRecord, b: FounderRecord) => b.founder_score.value - a.founder_score.value
        );
        setFounders(merged);
        setSignals(signalData.signals ?? []);
        setSummary(summaryData);
        setSelectedFounderId((current) => current && merged.some((founder) => founder.founder_id === current) ? current : merged[0]?.founder_id ?? null);
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
    setSelectedFounderId(founderId);
    setView("company");
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
      <Sidebar view={view} onView={setView} open={navOpen} onClose={() => setNavOpen(false)} reviewCount={summary.unverified_claims} />
      <div className="workspace">
        <Topbar view={view} onMenu={() => setNavOpen(true)} onSearch={() => setSearchOpen(true)} />
        {view === "dashboard" && <Dashboard onView={setView} onFounder={openFounder} founders={founders} signals={signals} summary={summary} loading={dataLoading} error={dataError} />}
        {view === "scanner" && <SignalScanner onDataChanged={() => setRefreshVersion((version) => version + 1)} />}
        {view === "intake" && <PitchIntake onCreated={(founderId) => { setSelectedFounderId(founderId); setRefreshVersion((version) => version + 1); }} />}
        {view === "discovery" && <Discovery founders={founders} onCompany={openFounder} />}
        {view === "company" && <Company founder={selectedFounder} onDiligence={() => setView("diligence")} onOpenChat={() => setChatOpen(true)} />}
        {view === "diligence" && <Diligence founder={selectedFounder} />}
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={setView} />
      <InvestorChat key={selectedFounder?.founder_id ?? "none"} founder={selectedFounder} open={chatOpen} onOpenChange={setChatOpen} />
    </main>
  );
}
