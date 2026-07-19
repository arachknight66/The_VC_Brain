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

type FounderResult = {
  founder_id: string;
  name: string;
  company_name: string;
  founder_score: { value: number };
  source_evidence: Array<{ source: string; title: string; url: string; confidence: number }>;
};

const API_BASE = process.env.NEXT_PUBLIC_VC_BRAIN_API_URL ?? "http://localhost:8000";

const founders = [
  { name: "Priya Nandakumar", company: "Ridgeline", role: "Developer tools", score: 92, stage: "Seed", initials: "PN", tone: "indigo", signal: "+8 this week" },
  { name: "Marcus Ihediwa", company: "Ledgerly", role: "Embedded finance", score: 84, stage: "Pre-seed", initials: "MI", tone: "orange", signal: "+5 this week" },
  { name: "Alina Moroz", company: "NeuroStream", role: "Healthcare AI", score: 88, stage: "Series A", initials: "AM", tone: "cyan", signal: "+12 this week" },
  { name: "Julian Vance", company: "Conduit Labs", role: "Climate infrastructure", score: 79, stage: "Seed", initials: "JV", tone: "violet", signal: "+4 this week" },
  { name: "Sana Jenkins", company: "Fieldnote", role: "Vertical SaaS", score: 76, stage: "Pre-seed", initials: "SJ", tone: "green", signal: "+7 this week" },
  { name: "Leo Chen", company: "Onward Robotics", role: "Robotics", score: 81, stage: "Seed", initials: "LC", tone: "blue", signal: "+6 this week" },
];

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

function Avatar({ founder, small = false }: { founder: (typeof founders)[number]; small?: boolean }) {
  return <span className={`avatar ${founder.tone} ${small ? "small" : ""}`}>{founder.initials}</span>;
}

function Sidebar({ view, onView, open, onClose }: { view: View; onView: (view: View) => void; open: boolean; onClose: () => void }) {
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
              {id === "diligence" && <span className="nav-count">3</span>}
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

function Dashboard({ onView }: { onView: (view: View) => void }) {
  const bars = [28, 46, 38, 62, 50, 76, 66, 84, 72, 91, 78, 96];
  return (
    <div className="view dashboard-view">
      <section className="hero-row">
        <div>
          <span className="section-kicker"><Sparkles size={14} /> Monday briefing</span>
          <h1>Good morning, Arjun.</h1>
          <p>Your pipeline gained <strong>14 high-confidence signals</strong> since Friday.</p>
        </div>
        <div className="hero-actions">
          <button className="secondary-button" onClick={() => onView("intake")}><Plus size={16} /> Add company</button>
          <button className="primary-button" onClick={() => onView("scanner")}><Search size={16} /> Scan live signals</button>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Portfolio metrics">
        <MetricCard icon={Users} label="Founders tracked" value="248" meta="+18 this month" tone="blue" />
        <MetricCard icon={Zap} label="New signals" value="42" meta="+14 since Friday" tone="violet" />
        <MetricCard icon={ShieldCheck} label="In diligence" value="12" meta="3 need review" tone="green" />
        <MetricCard icon={FileCheck2} label="Memos ready" value="8" meta="2 awaiting notes" tone="orange" />
      </section>

      <section className="dashboard-grid">
        <article className="panel recent-panel">
          <div className="panel-heading">
            <div><h2>Recent analysis</h2><p>Highest-momentum opportunities</p></div>
            <button className="text-button" onClick={() => onView("discovery")}>View all <ArrowRight size={14} /></button>
          </div>
          <div className="analysis-list">
            {founders.slice(0, 4).map((founder) => (
              <button className="analysis-row" key={founder.company} onClick={() => onView("company")}>
                <Avatar founder={founder} />
                <span className="founder-copy"><strong>{founder.company}</strong><small>{founder.name} · {founder.role}</small></span>
                <span className="signal-tag">{founder.signal}</span>
                <span className="score-badge"><strong>{founder.score}</strong><small>/100</small></span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </article>

        <article className="panel feed-panel">
          <div className="panel-heading">
            <div><h2>Live signal feed</h2><p>Evidence from your monitored network</p></div>
            <span className="live-dot">Live</span>
          </div>
          <div className="feed-list">
            <div className="feed-item"><span className="feed-icon github"><Github size={15} /></span><div><strong>Ridgeline shipped 3 releases</strong><p>Repository velocity is up 42% week over week.</p><small>12 min ago</small></div></div>
            <div className="feed-item"><span className="feed-icon funding"><TrendingUp size={15} /></span><div><strong>NeuroStream updated hiring</strong><p>Added 4 senior ML infrastructure roles.</p><small>43 min ago</small></div></div>
            <div className="feed-item"><span className="feed-icon web"><Globe2 size={15} /></span><div><strong>Ledgerly traction verified</strong><p>Three design partners confirmed via public sources.</p><small>2 hr ago</small></div></div>
            <div className="feed-item"><span className="feed-icon people"><Users size={15} /></span><div><strong>Warm path found</strong><p>Maya Patel can introduce you to Julian Vance.</p><small>4 hr ago</small></div></div>
          </div>
        </article>

        <article className="panel momentum-panel">
          <div className="panel-heading">
            <div><h2>Pipeline momentum</h2><p>Signal volume across the last 12 weeks</p></div>
            <button className="select-button">Last 12 weeks <ChevronDown size={14} /></button>
          </div>
          <div className="chart-summary">
            <div><strong>387</strong><span>Total signals</span></div>
            <div><strong>74%</strong><span>High confidence</span></div>
            <div><strong>2.4×</strong><span>Faster to memo</span></div>
          </div>
          <div className="bar-chart" aria-label="Increasing signal volume">
            {bars.map((height, index) => <span key={index} style={{ height: `${height}%` }}><i /></span>)}
          </div>
          <div className="chart-axis"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span></div>
        </article>

        <article className="panel thesis-panel">
          <div className="panel-heading"><div><h2>Thesis radar</h2><p>Where momentum is building</p></div></div>
          {[
            ["AI infrastructure", 88, "+12%"],
            ["Developer tools", 76, "+8%"],
            ["Vertical SaaS", 64, "+4%"],
            ["Climate software", 52, "+7%"],
          ].map(([label, value, growth]) => (
            <div className="thesis-row" key={label}>
              <div><strong>{label}</strong><span>{growth}</span></div>
              <div className="progress"><i style={{ width: `${value}%` }} /></div>
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}

function Discovery({ onCompany }: { onCompany: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => founders.filter((founder) => `${founder.name} ${founder.company} ${founder.role}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <div className="view discovery-view">
      <section className="discovery-hero">
        <span className="section-kicker"><Target size={14} /> Founder discovery</span>
        <h1>Discover your next big founder.</h1>
        <p>Ask The VC Brain to find exceptional founders matching your investment thesis.</p>
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
        <div><strong>{filtered.length} high-fit founders</strong><span> ranked by thesis fit and evidence quality</span></div>
        <div className="filter-actions"><button className="select-button">Stage <ChevronDown size={14} /></button><button className="select-button">Sector <ChevronDown size={14} /></button><button className="select-button">Sort: Best fit <ChevronDown size={14} /></button></div>
      </div>
      <section className="founder-grid">
        {filtered.map((founder, index) => (
          <article className="founder-card" key={founder.company}>
            <div className="founder-card-top"><Avatar founder={founder} /><span className="fit-pill">{index < 2 ? "Strong fit" : "Good fit"}</span></div>
            <h2>{founder.name}</h2><p className="company-line">{founder.company} <span>·</span> {founder.stage}</p>
            <p className="founder-summary">{index % 2 === 0 ? "Technical founder with clear product velocity and a strong operator track record." : "Domain expert building in a large market with early, verifiable customer pull."}</p>
            <div className="evidence-chips"><span><Github size={13} /> Build verified</span><span><TrendingUp size={13} /> Momentum</span></div>
            <div className="card-score"><span><small>Founder score</small><strong>{founder.score}<em>/100</em></strong></span><div className="mini-ring" style={{ "--score": `${founder.score * 3.6}deg` } as React.CSSProperties}><span>{founder.score}</span></div></div>
            <div className="card-actions"><button className="secondary-button">Save</button><button className="primary-button" onClick={onCompany}>Analyze <ArrowRight size={14} /></button></div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return <div className="score-line"><div><span>{label}</span><strong>{value}</strong></div><div className="progress"><i style={{ width: `${value}%` }} /></div></div>;
}

function Company({ onDiligence }: { onDiligence: () => void }) {
  return (
    <div className="view company-view">
      <div className="company-header">
        <div className="company-identity"><span className="company-logo">R</span><div><span className="section-kicker">Developer tools · Seed</span><h1>Ridgeline</h1><p>CI/CD observability for modern platform teams</p></div></div>
        <div className="hero-actions"><button className="secondary-button"><Globe2 size={16} /> Website</button><button className="primary-button" onClick={onDiligence}><ShieldCheck size={16} /> Open diligence</button></div>
      </div>
      <div className="company-layout">
        <div className="company-main">
          <article className="panel executive-card">
            <div className="panel-heading"><div><span className="section-kicker"><Bot size={14} /> AI synthesis</span><h2>Intelligence executive summary</h2></div><span className="confidence-pill"><Check size={13} /> 92% confidence</span></div>
            <p>Ridgeline combines a strong founder-market fit with unusually clear product velocity. Priya Nandakumar’s platform engineering experience at Stripe maps directly to the problem, while 40% month-over-month growth and 210 paying teams provide credible early validation.</p>
            <div className="summary-tags"><span>Founder–market fit</span><span>Verified traction</span><span>Technical moat</span><span className="warning">Pricing risk</span></div>
          </article>
          <section className="company-stats">
            <article className="panel stat-box"><small>Monthly recurring revenue</small><strong>$38K</strong><span className="positive">↑ 40% MoM</span></article>
            <article className="panel stat-box"><small>Paying teams</small><strong>210</strong><span>1,150 weekly developers</span></article>
            <article className="panel stat-box"><small>Last funding</small><strong>$2.4M</strong><span>Seed · Jan 2025</span></article>
          </section>
          <article className="panel">
            <div className="panel-heading"><div><h2>Why this could win</h2><p>Evidence-backed investment hypotheses</p></div><button className="text-button">View sources <ArrowRight size={14} /></button></div>
            <div className="hypothesis-list">
              <div><span>01</span><div><strong>Founder insight compounds into product advantage</strong><p>Three years on Stripe’s developer platform gave Priya direct exposure to the observability gaps Ridgeline now solves.</p></div></div>
              <div><span>02</span><div><strong>Expansion is visible inside the usage data</strong><p>Teams broaden from CI visibility into release intelligence, creating a credible seat and workflow expansion path.</p></div></div>
              <div><span>03</span><div><strong>Category timing is favorable</strong><p>Platform teams are consolidating tooling while AI-generated code sharply increases deployment volume.</p></div></div>
            </div>
          </article>
          <article className="panel team-panel">
            <div className="panel-heading"><div><h2>Founding team</h2><p>Relevant experience and network strength</p></div></div>
            <div className="team-grid"><div><span className="avatar indigo">PN</span><strong>Priya Nandakumar</strong><small>CEO · ex-Stripe</small></div><div><span className="avatar cyan">WM</span><strong>Wes Morgan</strong><small>CTO · ex-Datadog</small></div></div>
          </article>
        </div>
        <aside className="company-rail">
          <article className="panel overall-score"><span className="mini-ring large" style={{ "--score": "331deg" } as React.CSSProperties}><strong>92</strong><small>/100</small></span><div><span>Founder score</span><strong>Exceptional</strong><small>Top 4% of tracked companies</small></div></article>
          <article className="panel scorecard"><div className="panel-heading"><div><h2>Intelligence scorecard</h2></div></div><ScoreBar label="Founder fit" value={96} /><ScoreBar label="Market quality" value={84} /><ScoreBar label="Idea × market" value={91} /><ScoreBar label="Evidence trust" value={92} /></article>
          <article className="panel watch-card"><div className="panel-heading"><div><h2>Watch items</h2></div><span>3</span></div><p><i className="high" /> Enterprise pricing not yet proven</p><p><i className="medium" /> Competitive response from incumbents</p><p><i className="low" /> Hiring pace versus runway</p></article>
          <button className="primary-button wide" onClick={onDiligence}><ShieldCheck size={16} /> Start diligence review</button>
        </aside>
      </div>
    </div>
  );
}

function Diligence() {
  const claims = [
    { title: "$38K MRR with 40% monthly growth", detail: "Corroborated by payment processor export and three customer references.", status: "Verified", confidence: 96 },
    { title: "1,150 weekly active developers", detail: "Product analytics screenshot covers 1,147 unique developers across 210 teams.", status: "Verified", confidence: 92 },
    { title: "#2 Product of the Day", detail: "Product Hunt launch archive confirms ranking on March 12, 2025.", status: "Verified", confidence: 99 },
    { title: "$18B serviceable market", detail: "Top-down estimate is plausible, but bottom-up penetration assumptions need work.", status: "Review", confidence: 64 },
  ];
  return (
    <div className="view diligence-view">
      <div className="diligence-header">
        <div><span className="section-kicker"><ShieldCheck size={14} /> Ridgeline · Active review</span><h1>Claims verification</h1><p>Trace every investment claim back to source evidence.</p></div>
        <button className="primary-button"><FileText size={16} /> Generate investment memo</button>
      </div>
      <section className="diligence-summary">
        <article><span className="metric-icon green"><Check size={18} /></span><div><strong>18</strong><small>Claims verified</small></div></article>
        <article><span className="metric-icon orange"><Clock3 size={18} /></span><div><strong>3</strong><small>Need review</small></div></article>
        <article><span className="metric-icon blue"><ShieldCheck size={18} /></span><div><strong>92%</strong><small>Evidence trust</small></div></article>
        <article><span className="metric-icon violet"><Activity size={18} /></span><div><strong>Low</strong><small>Contradiction risk</small></div></article>
      </section>
      <div className="diligence-layout">
        <section className="claims-column">
          <div className="section-heading"><div><h2>Priority claims</h2><p>Ranked by impact on the investment case</p></div><button className="select-button">All claims <ChevronDown size={14} /></button></div>
          {claims.map((claim, index) => (
            <article className="claim-card" key={claim.title}>
              <div className="claim-index">{String(index + 1).padStart(2, "0")}</div>
              <div className="claim-body">
                <div className="claim-title"><h3>{claim.title}</h3><span className={claim.status === "Verified" ? "verified" : "review"}>{claim.status === "Verified" ? <Check size={13} /> : <Clock3 size={13} />}{claim.status}</span></div>
                <p>{claim.detail}</p>
                <div className="source-row"><span><FileCheck2 size={14} /> {index + 2} sources</span><span><Globe2 size={14} /> Public evidence</span><button>Inspect evidence <ArrowRight size={13} /></button></div>
              </div>
              <div className="confidence-score"><strong>{claim.confidence}%</strong><small>confidence</small></div>
            </article>
          ))}
        </section>
        <aside className="diligence-rail">
          <article className="panel">
            <div className="panel-heading"><div><h2>Evidence coverage</h2><p>By memo section</p></div></div>
            <ScoreBar label="Team & history" value={96} /><ScoreBar label="Traction & KPIs" value={88} /><ScoreBar label="Market size" value={68} /><ScoreBar label="Competition" value={74} /><ScoreBar label="Financials" value={81} />
          </article>
          <article className="panel decision-card"><span className="section-kicker"><Lightbulb size={14} /> Recommended next step</span><h2>Validate enterprise expansion.</h2><p>Interview two customers with more than 50 seats and confirm willingness to consolidate adjacent tooling.</p><button className="secondary-button wide">Add diligence task <Plus size={14} /></button></article>
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

function SignalScanner() {
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
        <div><strong>{signals.length} persisted signals</strong><span> ranked by source confidence and activity</span></div>
      </div>
      <section className="signal-results">
        {!signals.length && !loading && <div className="empty-state"><Search size={24} /><strong>No scan results yet</strong><p>Choose sources and run a query to populate the live signal feed.</p></div>}
        {signals.map((signal) => (
          <article className="panel signal-card" key={signal.signal_id}>
            <span className={`source-mark ${signal.source}`}>{signal.source === "github" ? <Github size={16} /> : signal.source === "linkedin" ? <Linkedin size={16} /> : <Globe2 size={16} />}</span>
            <div><div className="signal-title"><span>{signal.source}</span><strong>{Math.round(signal.score)} confidence</strong></div><h2>{signal.title}</h2><p>{signal.summary || "Public source discovered without an extractable summary."}</p><a href={signal.source_url} target="_blank" rel="noreferrer">Inspect source <ArrowRight size={13} /></a></div>
          </article>
        ))}
      </section>
    </div>
  );
}

function PitchIntake() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<FounderResult | null>(null);

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
          {result && <article className="panel result-card"><span className="metric-icon green"><Check size={18} /></span><small>Analysis complete</small><h2>{result.company_name}</h2><p>{result.name}</p><strong>{Math.round(result.founder_score.value)}<em>/100</em></strong><span>{result.source_evidence.filter((item) => item.source === "linkedin").length} LinkedIn evidence result(s)</span></article>}
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
    { title: "Open Ridgeline intelligence profile", detail: "Company analysis", view: "company" as View },
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

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
      <Sidebar view={view} onView={setView} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="workspace">
        <Topbar view={view} onMenu={() => setNavOpen(true)} onSearch={() => setSearchOpen(true)} />
        {view === "dashboard" && <Dashboard onView={setView} />}
        {view === "scanner" && <SignalScanner />}
        {view === "intake" && <PitchIntake />}
        {view === "discovery" && <Discovery onCompany={() => setView("company")} />}
        {view === "company" && <Company onDiligence={() => setView("diligence")} />}
        {view === "diligence" && <Diligence />}
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={setView} />
    </main>
  );
}
