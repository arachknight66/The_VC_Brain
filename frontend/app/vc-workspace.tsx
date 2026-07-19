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
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Columns3,
  Download,
  FileCheck2,
  FileText,
  Globe2,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Menu,
  MessageSquare,
  Plus,
  Radar,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AppUser } from "./app-auth";

type View = "overview" | "inbox" | "pipeline" | "company" | "diligence" | "compare" | "memo" | "ic" | "portfolio" | "research" | "lab" | "intake";
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

type CompanyWorkflow = { stage: PipelineStage; owner: string; decision: string; updatedAt: string };
type ClaimReview = { status: ClaimReviewStatus; reviewer: string; updatedAt: string; note: string };
type DiligenceTask = { id: string; founderId: string; title: string; owner: string; due: string; status: "open" | "in_progress" | "done" };
type AuditEvent = { id: string; founderId: string; actor: string; action: string; timestamp: string };
type MemoReview = { status: "draft" | "in_review" | "approved"; version: number; reviewer: string; updatedAt: string; note: string };
type Toast = { id: string; message: string; tone: "success" | "info" | "warning" };
type ScenarioWeights = { founder: number; market: number; execution: number; evidence: number };
type SavedScenario = { id: string; name: string; weights: ScenarioWeights; createdAt: string };
type ICDecision = { outcome: "invest" | "hold" | "pass"; rationale: string; dissent: string; decidedBy: string; decidedAt: string };
type AlertRules = { confidenceFloor: number; staleEvidenceDays: number; contradictions: boolean };
type PortfolioAlert = { id: string; founderId: string; company: string; severity: "critical" | "warning" | "info"; title: string; detail: string };
type SessionUser = AppUser & { role?: "admin" | "member" | "viewer"; organizationName?: string };
type SyncStatus = "loading" | "saved" | "saving" | "conflict" | "error";
type WorkspaceState = {
  companies: Record<string, CompanyWorkflow>;
  claimReviews: Record<string, ClaimReview>;
  tasks: DiligenceTask[];
  audit: AuditEvent[];
  memos: Record<string, MemoReview>;
  savedViews: Array<{ id: string; name: string; stage: string; sector: string; sort: string; query?: string }>;
  savedScenarios: SavedScenario[];
  icDecisions: Record<string, ICDecision>;
  alertRules: AlertRules;
};

const API_BASE = "/api/vc";
const EMPTY_SUMMARY: DashboardSummary = { founder_records: 0, active_opportunities: 0, raw_signals: 0, memo_ready: 0, high_confidence_scores: 0, verified_builds: 0, verified_claims: 0, unverified_claims: 0, average_founder_score: 0, average_score_confidence: 0, average_signal_to_memo_seconds: null };
const DEFAULT_SCENARIO: ScenarioWeights = { founder: 30, market: 25, execution: 20, evidence: 25 };
const EMPTY_WORKSPACE: WorkspaceState = { companies: {}, claimReviews: {}, tasks: [], audit: [], memos: {}, savedViews: [], savedScenarios: [], icDecisions: {}, alertRules: { confidenceFloor: 70, staleEvidenceDays: 90, contradictions: true } };
const OWNERS = ["Arjun Kapoor", "Maya Chen", "Noah Williams", "Unassigned"];
const PIPELINE_STAGES: PipelineStage[] = ["New", "Qualified", "Partner review", "Diligence", "IC", "Invest", "Pass"];

const navItems = [
  { id: "overview" as View, label: "Overview", icon: LayoutDashboard },
  { id: "inbox" as View, label: "Inbox", icon: Inbox },
  { id: "pipeline" as View, label: "Pipeline", icon: Columns3 },
  { id: "diligence" as View, label: "Diligence", icon: ShieldCheck },
  { id: "ic" as View, label: "IC", icon: ClipboardCheck },
  { id: "portfolio" as View, label: "Portfolio", icon: BriefcaseBusiness },
  { id: "research" as View, label: "Research", icon: BookOpen },
  { id: "lab" as View, label: "Decision Lab", icon: Scale },
];

const viewTitles: Record<View, string> = {
  overview: "Investment Overview", inbox: "Research Inbox", pipeline: "Investment Pipeline", company: "Company Workspace",
  diligence: "Diligence", compare: "Company Comparison", memo: "Investment Memo", ic: "Investment Committee",
  portfolio: "Portfolio", research: "Research Library", lab: "Decision Lab", intake: "Pitch Intake",
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

function getSignalDimensions(signal: Signal) {
  const evidenceBySource: Record<string, number> = { github: 82, linkedin: 74, devpost: 68, substack: 60, x: 45 };
  const entity = signal.source === "github" ? 72 : signal.source === "linkedin" ? 78 : 58;
  return {
    relevance: Math.round(signal.score),
    entity,
    evidence: evidenceBySource[signal.source] ?? 55,
    novelty: Math.max(45, Math.min(96, 92 - Math.floor((Date.now() - new Date(signal.observed_at).getTime()) / 86400000))),
    materiality: Math.round(Math.min(95, signal.score * 0.78)),
  };
}

function defaultWorkflow(founder: FounderRecord): CompanyWorkflow {
  const stage: PipelineStage = founder.screened_out ? "Pass" : founder.founder_score.value >= 75 ? "Diligence" : founder.founder_score.value >= 55 ? "Qualified" : "New";
  return { stage, owner: "Unassigned", decision: getDecision(founder).label, updatedAt: new Date().toISOString() };
}

function normalizeWorkspace(value: Partial<WorkspaceState> | null): WorkspaceState {
  return {
    ...EMPTY_WORKSPACE,
    ...(value ?? {}),
    companies: value?.companies ?? {},
    claimReviews: value?.claimReviews ?? {},
    tasks: value?.tasks ?? [],
    audit: value?.audit ?? [],
    memos: value?.memos ?? {},
    savedViews: value?.savedViews ?? [],
    savedScenarios: value?.savedScenarios ?? [],
    icDecisions: value?.icDecisions ?? {},
    alertRules: { ...EMPTY_WORKSPACE.alertRules, ...(value?.alertRules ?? {}) },
  };
}

function getScenarioDimensions(founder: FounderRecord) {
  const verifiedClaims = founder.trust_claims.filter((claim) => claim.evidence_category === "known_verified" && !claim.contradiction_flag).length;
  const contradictions = founder.trust_claims.filter((claim) => claim.contradiction_flag).length;
  const buildChecks = founder.build_evidence.evidence_log;
  const buildRatio = buildChecks.length ? buildChecks.filter((item) => item.found).length / buildChecks.length : 0;
  return {
    founder: Math.round(founder.axis_scores.founder?.score || founder.founder_score.value),
    market: Math.round(founder.axis_scores.market?.score || 0),
    execution: Math.round(buildRatio * 100),
    evidence: Math.max(0, Math.min(100, founder.source_evidence.length * 12 + verifiedClaims * 10 - contradictions * 15)),
  };
}

function getScenarioScore(founder: FounderRecord, weights: ScenarioWeights) {
  const dimensions = getScenarioDimensions(founder);
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
  const score = Object.entries(weights).reduce((sum, [key, weight]) => sum + dimensions[key as keyof ScenarioWeights] * weight, 0) / total;
  return { score: Math.round(score), dimensions };
}

function getPortfolioAlerts(founders: FounderRecord[], workflow: WorkspaceState): PortfolioAlert[] {
  const now = Date.now();
  return founders.flatMap((founder) => {
    const company = workflow.companies[founder.founder_id] ?? defaultWorkflow(founder);
    if (company.stage !== "Invest") return [];
    const alerts: PortfolioAlert[] = [];
    const contradictions = founder.trust_claims.filter((claim) => claim.contradiction_flag).length;
    if (workflow.alertRules.contradictions && contradictions) alerts.push({ id: `${founder.founder_id}-contradictions`, founderId: founder.founder_id, company: founder.company_name, severity: "critical", title: `${contradictions} contradiction ${contradictions === 1 ? "flag" : "flags"}`, detail: "A material claim now conflicts with the evidence record." });
    const confidence = Math.round(founder.founder_score.confidence * 100);
    if (confidence < workflow.alertRules.confidenceFloor) alerts.push({ id: `${founder.founder_id}-confidence`, founderId: founder.founder_id, company: founder.company_name, severity: "warning", title: `Confidence fell below ${workflow.alertRules.confidenceFloor}%`, detail: `Current model confidence is ${confidence}%; refresh primary evidence before the next board cycle.` });
    const newestEvidence = founder.source_evidence.map((source) => new Date(source.collected_at || 0).getTime()).filter(Number.isFinite).sort((a, b) => b - a)[0] || 0;
    const ageDays = newestEvidence ? Math.floor((now - newestEvidence) / 86400000) : Number.POSITIVE_INFINITY;
    if (ageDays > workflow.alertRules.staleEvidenceDays) alerts.push({ id: `${founder.founder_id}-stale`, founderId: founder.founder_id, company: founder.company_name, severity: "info", title: "Evidence refresh is overdue", detail: newestEvidence ? `Newest source is ${ageDays} days old.` : "No dated portfolio evidence is attached." });
    if (founder.founder_score.trend === "declining") alerts.push({ id: `${founder.founder_id}-trend`, founderId: founder.founder_id, company: founder.company_name, severity: "warning", title: "Founder signal is declining", detail: "The latest score trend moved down; inspect the underlying evidence before reacting." });
    return alerts;
  });
}

function routeState(): { view: View; founderId: string | null; compareIds: string[] } {
  if (typeof window === "undefined") return { view: "overview", founderId: null, compareIds: [] };
  const parts = window.location.pathname.split("/").filter(Boolean);
  const map: Record<string, View> = { inbox: "inbox", pipeline: "pipeline", diligence: "diligence", compare: "compare", memos: "memo", ic: "ic", portfolio: "portfolio", research: "research", lab: "lab", intake: "intake", companies: "company" };
  return { view: parts.length ? map[parts[0]] ?? "overview" : "overview", founderId: ["companies", "diligence", "memos"].includes(parts[0]) ? decodeURIComponent(parts[1] || "") || null : null, compareIds: new URLSearchParams(window.location.search).get("ids")?.split(",").filter(Boolean) ?? [] };
}

function routeFor(view: View, founderId?: string | null, compareIds: string[] = []) {
  if (view === "overview") return "/";
  if (view === "company") return founderId ? `/companies/${encodeURIComponent(founderId)}` : "/pipeline";
  if (view === "diligence") return founderId ? `/diligence/${encodeURIComponent(founderId)}` : "/diligence";
  if (view === "memo") return founderId ? `/memos/${encodeURIComponent(founderId)}` : "/pipeline";
  if (view === "compare") return `/compare?ids=${compareIds.map(encodeURIComponent).join(",")}`;
  return `/${view}`;
}

function Logo() {
  return <div className="logo" aria-label="The VC Brain"><span className="logo-mark"><span /><span /><span /><span /></span><span><strong>The VC Brain</strong><small>Investment OS</small></span></div>;
}

function Avatar({ founder, small = false }: { founder: FounderRecord; small?: boolean }) {
  const initials = founder.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className={`avatar blue ${small ? "small" : ""}`}>{initials}</span>;
}

function Sidebar({ view, onNavigate, open, onClose, inboxCount, diligenceCount, user }: { view: View; onNavigate: (view: View) => void; open: boolean; onClose: () => void; inboxCount: number; diligenceCount: number; user: SessionUser }) {
  return <>{open && <button className="scrim" aria-label="Close navigation" onClick={onClose} />}<aside className={`sidebar ${open ? "open" : ""}`}>
    <div className="sidebar-top"><Logo /><button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button></div>
    <nav aria-label="Primary navigation"><p className="eyebrow">Investment workflow</p>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${view === id ? "active" : ""}`} onClick={() => { onNavigate(id); onClose(); }}><Icon size={17} /><span>{label}</span>{id === "inbox" && inboxCount > 0 && <span className="nav-count neutral">{inboxCount}</span>}{id === "diligence" && diligenceCount > 0 && <span className="nav-count">{diligenceCount}</span>}</button>)}</nav>
    <div className="sidebar-bottom"><div className="user"><span className="avatar blue small">{initials(user.displayName)}</span><span><strong>{user.displayName}</strong><small>{user.role ? `${labelize(user.role)} · ${user.organizationName || "Investment team"}` : user.email}</small></span></div><Link className="signout-link" href="/api/auth/google/logout?return_to=%2F">Sign out</Link></div>
  </aside></>;
}

function Topbar({ view, onMenu, onQuickActions, online, syncStatus, user }: { view: View; onMenu: () => void; onQuickActions: () => void; online: boolean; syncStatus: SyncStatus; user: SessionUser }) {
  const syncLabel = !online ? "Offline" : syncStatus === "saving" ? "Saving…" : syncStatus === "conflict" ? "Updated elsewhere" : syncStatus === "error" ? "Sync failed" : syncStatus === "loading" ? "Connecting…" : "Shared workspace saved";
  return <header className="topbar"><div className="topbar-title"><button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button><span>{viewTitles[view]}</span></div><button className="command-search" onClick={onQuickActions} aria-keyshortcuts="Control+K Meta+K"><Search size={15} /><span>Quick actions</span><kbd>⌘ K</kbd></button><div className="top-actions"><span className={`connection-state ${online && !["error", "conflict"].includes(syncStatus) ? "online" : "offline"}`} title={syncLabel}>{syncStatus === "saving" || syncStatus === "loading" ? <RefreshCw className="spin" size={14} /> : online ? <Wifi size={14} /> : <WifiOff size={14} />}<span>{syncLabel}</span></span><span className="avatar blue small" title={user.email}>{initials(user.displayName)}</span></div></header>;
}

function LoadingWorkspace() {
  return <div className="view loading-workspace" role="status" aria-live="polite"><span className="sr-only">Loading investment workspace</span><div className="skeleton skeleton-title" /><div className="skeleton skeleton-copy" /><div className="loading-grid"><div className="panel skeleton-panel" /><div className="panel skeleton-panel short" /></div></div>;
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="api-error-banner" role="alert"><AlertTriangle size={18} /><div><strong>Workspace data is unavailable</strong><span>{message}</span></div><button className="secondary-button" onClick={onRetry}><RefreshCw size={14} /> Retry</button></div>;
}

function ToastRegion({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return <div className="toast-region" aria-live="polite" aria-atomic="false">{toasts.map((toast) => <div className={`toast ${toast.tone}`} role="status" key={toast.id}><CheckCircle2 size={17} /><span>{toast.message}</span><button onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"><X size={14} /></button></div>)}</div>;
}

function Overview({ founders, signals, summary, workflow, onOpen, onNavigate }: { founders: FounderRecord[]; signals: Signal[]; summary: DashboardSummary; workflow: WorkspaceState; onOpen: (id: string) => void; onNavigate: (view: View) => void }) {
  const decisionQueue = founders.filter((founder) => ["Partner review", "Diligence", "IC"].includes((workflow.companies[founder.founder_id] ?? defaultWorkflow(founder)).stage)).slice(0, 5);
  const blocked = founders.filter((founder) => getDecision(founder).label === "Hold").length;
  return <div className="view">
    <section className="hero-row"><div><span className="section-kicker"><Sparkles size={14} /> Morning investment brief</span><h1>{decisionQueue.length} decisions need attention.</h1><p>{blocked} companies are blocked by evidence gaps; {summary.unverified_claims} claims require review.</p></div><div className="hero-actions"><button className="secondary-button" onClick={() => onNavigate("intake")}><Upload size={16} /> Add pitch</button><button className="primary-button" onClick={() => onNavigate("inbox")}><Inbox size={16} /> Review inbox</button></div></section>
    <section className="brief-grid">
      <article className="panel decision-queue"><div className="panel-heading"><div><h2>Decision queue</h2><p>Ordered by stage and evidence risk</p></div><button className="text-button" onClick={() => onNavigate("pipeline")}>Open pipeline <ArrowRight size={14} /></button></div>
        {decisionQueue.map((founder) => { const company = workflow.companies[founder.founder_id] ?? defaultWorkflow(founder); const decision = getDecision(founder); return <button className="queue-row" onClick={() => onOpen(founder.founder_id)} key={founder.founder_id}><Avatar founder={founder} /><span><strong>{founder.company_name}</strong><small>{company.stage} · {company.owner}</small></span><span className={`decision-chip ${decision.tone}`}>{decision.label}</span><span className="queue-risk">{decision.reason}</span><ArrowRight size={15} /></button>; })}
        {!decisionQueue.length && <div className="inline-empty">No companies are currently awaiting a decision.</div>}
      </article>
      <aside className="brief-rail">
        <article className="panel brief-stat"><span className="metric-icon violet"><Inbox size={18} /></span><div><strong>{signals.length}</strong><span>Signals in inbox</span><small>Review before persistence</small></div></article>
        <article className="panel brief-stat"><span className="metric-icon orange"><AlertTriangle size={18} /></span><div><strong>{blocked}</strong><span>Evidence-blocked</span><small>Cannot advance to IC</small></div></article>
        <article className="panel brief-stat"><span className="metric-icon green"><FileCheck2 size={18} /></span><div><strong>{Object.values(workflow.memos).filter((memo) => memo.status === "approved").length}</strong><span>Approved memos</span><small>Decision record complete</small></div></article>
      </aside>
    </section>
  </div>;
}

function SignalInbox({ persistedSignals, onDataChanged, onIntake, notify }: { persistedSignals: Signal[]; onDataChanged: () => void; onIntake: () => void; notify: (message: string, tone?: Toast["tone"]) => void }) {
  const [query, setQuery] = useState("AI infrastructure");
  const [sources, setSources] = useState(["github", "linkedin", "substack"]);
  const [preview, setPreview] = useState<Signal[]>([]);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const scannerSources = ["github", "x", "substack", "devpost", "linkedin"];

  const runPreview = async () => {
    if (!query.trim() || !sources.length) return setMessage("Enter a query and select at least one source.");
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`${API_BASE}/scanners/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, sources, max_results: 8, persist: false }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "Scanner preview failed.");
      setPreview(data.signals ?? []); setAccepted(new Set()); setDismissed(new Set());
      setMessage(`${data.signals?.length ?? 0} results ready for review. Nothing has been saved.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Scanner unavailable."); } finally { setLoading(false); }
  };

  const commitReview = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/signals/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signals: preview, accepted_ids: [...accepted] }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "Could not save reviewed signals.");
      setMessage(`${data.accepted} accepted; ${data.dismissed} dismissed. Only accepted signals were persisted.`);
      setPreview([]); setAccepted(new Set()); setDismissed(new Set()); onDataChanged();
      notify(`${data.accepted} signals added to institutional research.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save reviewed signals.");
    } finally {
      setSaving(false);
    }
  };

  const setReview = (id: string, outcome: "accept" | "dismiss") => {
    setAccepted((current) => { const next = new Set(current); if (outcome === "accept") next.add(id); else next.delete(id); return next; });
    setDismissed((current) => { const next = new Set(current); if (outcome === "dismiss") next.add(id); else next.delete(id); return next; });
  };

  return <div className="view">
    <section className="workflow-hero"><div><span className="section-kicker"><Inbox size={14} /> Research inbox</span><h1>Review signals before they enter the system.</h1><p>Preview public-source matches, inspect the scoring dimensions, then accept only evidence worth retaining.</p></div><button className="secondary-button" onClick={onIntake}><Upload size={15} /> Pitch intake</button></section>
    <article className="panel workflow-panel" aria-busy={loading}><span className="field-label">Thesis, founder, or company query</span><div className="scanner-query"><label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") runPreview(); }} aria-label="Signal search query" /></label><button className="primary-button" disabled={loading || saving} onClick={runPreview}>{loading ? <><RefreshCw className="spin" size={15} /> Scanning…</> : <>Preview results <ArrowRight size={15} /></>}</button></div><div className="source-selector" aria-label="Scanner sources">{scannerSources.map((source) => <button key={source} aria-pressed={sources.includes(source)} className={sources.includes(source) ? "selected" : ""} onClick={() => setSources((current) => current.includes(source) ? current.filter((item) => item !== source) : [...current, source])}>{labelize(source)}{sources.includes(source) && <Check size={13} />}</button>)}</div>{message && <p className="workflow-message" role="status">{message}</p>}</article>
    <div className="review-toolbar"><div><strong>{preview.length ? `${preview.length} preview results` : `${persistedSignals.length} persisted signals`}</strong><span>{preview.length ? `${accepted.size} accepted · ${dismissed.size} dismissed · ${preview.length - accepted.size - dismissed.size} remaining` : "Run a query to create a review batch"}</span></div>{preview.length > 0 && <button className="primary-button" disabled={accepted.size + dismissed.size !== preview.length || saving} onClick={commitReview}>{saving ? <><RefreshCw className="spin" size={15} /> Saving…</> : <>Complete review <CheckCircle2 size={15} /></>}</button>}</div>
    <section className="signal-review-list">{preview.map((signal) => { const dimensions = getSignalDimensions(signal); const outcome = accepted.has(signal.signal_id) ? "accepted" : dismissed.has(signal.signal_id) ? "dismissed" : "pending"; return <article className={`panel signal-review-row ${outcome}`} key={signal.signal_id}><div className="signal-review-main"><span className="source-mark"><Globe2 size={16} /></span><div><span className="source-label">{labelize(signal.source)} · Observed {formatDate(signal.observed_at)}</span><h2>{signal.title}</h2><p>{signal.summary || "No extractable public summary."}</p><a href={signal.source_url} target="_blank" rel="noreferrer">Inspect source <ArrowRight size={13} /></a></div></div><div className="dimension-grid">{Object.entries(dimensions).map(([label, value]) => <div key={label}><span>{labelize(label)}</span><strong>{value}</strong><i><b style={{ width: `${value}%` }} /></i></div>)}</div><div className="review-actions"><button className={outcome === "accepted" ? "selected accept" : "accept"} onClick={() => setReview(signal.signal_id, "accept")}><Check size={15} /> Accept</button><button className={outcome === "dismissed" ? "selected dismiss" : "dismiss"} onClick={() => setReview(signal.signal_id, "dismiss")}><X size={15} /> Dismiss</button></div></article>; })}</section>
  </div>;
}

function Pipeline({ founders, workflow, updateCompany, saveView, onOpen, onCompare, notify, owners }: { founders: FounderRecord[]; workflow: WorkspaceState; updateCompany: (id: string, patch: Partial<CompanyWorkflow>) => void; saveView: (view: WorkspaceState["savedViews"][number]) => void; onOpen: (id: string) => void; onCompare: (ids: string[]) => void; notify: (message: string, tone?: Toast["tone"]) => void; owners: string[] }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");
  const [sector, setSector] = useState("all");
  const [sort, setSort] = useState("score");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const sectors = [...new Set(founders.map((founder) => String(founder.raw_inputs.sector || "Unclassified")))].sort();
  const rows = founders.filter((founder) => `${founder.name} ${founder.company_name} ${String(founder.raw_inputs.sector || "")}`.toLowerCase().includes(query.toLowerCase())).filter((founder) => stage === "all" || (workflow.companies[founder.founder_id] ?? defaultWorkflow(founder)).stage === stage).filter((founder) => sector === "all" || String(founder.raw_inputs.sector || "Unclassified") === sector).sort((a, b) => sort === "confidence" ? b.founder_score.confidence - a.founder_score.confidence : b.founder_score.value - a.founder_score.value);
  const toggle = (id: string) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const allVisibleSelected = rows.length > 0 && rows.every((founder) => selected.has(founder.founder_id));
  const toggleAllVisible = () => setSelected((current) => {
    const next = new Set(current);
    rows.forEach((founder) => allVisibleSelected ? next.delete(founder.founder_id) : next.add(founder.founder_id));
    return next;
  });
  const applySavedView = (id: string) => {
    const saved = workflow.savedViews.find((view) => view.id === id);
    if (!saved) return;
    setStage(saved.stage); setSector(saved.sector); setSort(saved.sort); setQuery(saved.query ?? "");
  };
  const saveCurrentView = () => {
    const name = [stage !== "all" ? stage : "", sector !== "all" ? sector : "", query.trim()].filter(Boolean).join(" · ") || `Pipeline view ${workflow.savedViews.length + 1}`;
    saveView({ id: crypto.randomUUID(), name, stage, sector, sort, query });
    notify(`Saved “${name}” as a pipeline view.`);
  };
  const clearFilters = () => { setQuery(""); setStage("all"); setSector("all"); setSort("score"); };
  return <div className="view pipeline-view">
    <section className="workflow-hero"><div><span className="section-kicker"><Columns3 size={14} /> Investment pipeline</span><h1>Move companies through decisions.</h1><p>Filter, assign, compare, and advance opportunities without losing evidence context.</p></div><button className="primary-button" onClick={() => onCompare([...selected])} disabled={selected.size < 2 || selected.size > 4}><BarChart3 size={15} /> Compare {selected.size || ""}</button></section>
    <article className="panel table-controls"><label className="table-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, founder, or sector" /></label><label className="select-control"><select aria-label="Saved pipeline views" defaultValue="" onChange={(event) => { applySavedView(event.target.value); event.currentTarget.value = ""; }}><option value="" disabled>Saved views</option>{workflow.savedViews.map((view) => <option value={view.id} key={view.id}>{view.name}</option>)}</select><ChevronDown size={14} /></label><button className="secondary-button compact" onClick={saveCurrentView}>Save view</button><label className="select-control"><select aria-label="Filter by stage" value={stage} onChange={(event) => setStage(event.target.value)}><option value="all">All stages</option>{PIPELINE_STAGES.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label><label className="select-control"><select aria-label="Filter by sector" value={sector} onChange={(event) => setSector(event.target.value)}><option value="all">All sectors</option>{sectors.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label><label className="select-control"><select aria-label="Sort pipeline" value={sort} onChange={(event) => setSort(event.target.value)}><option value="score">Sort: score</option><option value="confidence">Sort: confidence</option></select><ChevronDown size={14} /></label>{(query || stage !== "all" || sector !== "all" || sort !== "score") && <button className="text-button clear-filters" onClick={clearFilters}><X size={14} /> Reset</button>}</article>
    <div className="table-result-summary" role="status">{rows.length} of {founders.length} companies</div>
    {selected.size > 0 && <div className="bulk-bar"><strong>{selected.size} selected</strong><button onClick={() => { [...selected].forEach((id) => updateCompany(id, { owner: owners[0] })); notify(`${selected.size} companies assigned to you.`); }}>Assign to me</button><button onClick={() => { [...selected].forEach((id) => updateCompany(id, { stage: "Diligence" })); notify(`${selected.size} companies moved to diligence.`); }}>Move to diligence</button><button onClick={() => setSelected(new Set())}>Clear</button></div>}
    <div className="panel pipeline-table-wrap"><table className="pipeline-table"><thead><tr><th><input type="checkbox" aria-label="Select all visible companies" checked={allVisibleSelected} onChange={toggleAllVisible} /></th><th>Company</th><th>Stage</th><th>Recommendation</th><th>Evidence</th><th>Owner</th><th>Score</th><th>Updated</th><th /></tr></thead><tbody>{rows.map((founder) => { const company = workflow.companies[founder.founder_id] ?? defaultWorkflow(founder); const decision = getDecision(founder); return <tr key={founder.founder_id}><td><input type="checkbox" aria-label={`Select ${founder.company_name}`} checked={selected.has(founder.founder_id)} onChange={() => toggle(founder.founder_id)} /></td><td><button className="company-cell" onClick={() => onOpen(founder.founder_id)}><Avatar founder={founder} small /><span><strong>{founder.company_name}</strong><small>{founder.name} · {labelize(String(founder.raw_inputs.sector || "Unclassified"))}</small></span></button></td><td><select aria-label={`Stage for ${founder.company_name}`} value={company.stage} onChange={(event) => updateCompany(founder.founder_id, { stage: event.target.value as PipelineStage })}>{PIPELINE_STAGES.map((item) => <option key={item}>{item}</option>)}</select></td><td><span className={`decision-chip ${decision.tone}`}>{decision.label}</span><small>{decision.reason}</small></td><td><strong>{founder.source_evidence.length + founder.trust_claims.length}</strong><small>{founder.source_evidence.length} sources · {founder.trust_claims.length} claims</small></td><td><select aria-label={`Owner for ${founder.company_name}`} value={company.owner} onChange={(event) => updateCompany(founder.founder_id, { owner: event.target.value })}>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select></td><td><strong>{Math.round(founder.founder_score.value)}</strong><small>{Math.round(founder.founder_score.confidence * 100)}% confidence</small></td><td>{formatDate(company.updatedAt)}</td><td><button className="icon-button" aria-label={`Open ${founder.company_name}`} onClick={() => onOpen(founder.founder_id)}><ArrowRight size={15} /></button></td></tr>; })}</tbody></table>{!rows.length && <div className="inline-empty">No companies match the current view. <button className="text-button" onClick={clearFilters}>Clear filters</button></div>}</div>
  </div>;
}

function CompanyWorkspace({ founder, workflow, onDiligence, onMemo, updateCompany, owners }: { founder: FounderRecord | null; workflow: WorkspaceState; onDiligence: () => void; onMemo: () => void; updateCompany: (id: string, patch: Partial<CompanyWorkflow>) => void; owners: string[] }) {
  const [tab, setTab] = useState<"decision" | "evidence" | "risks">("decision");
  if (!founder) return <Empty title="Company not found" detail="Return to the pipeline and choose a valid company." />;
  const company = workflow.companies[founder.founder_id] ?? defaultWorkflow(founder);
  const decision = getDecision(founder);
  const hypotheses = Array.isArray(founder.memo.investment_hypotheses) ? founder.memo.investment_hypotheses.filter((item): item is string => typeof item === "string") : [];
  const bearCase = typeof founder.adversarial_view.bear_case_summary === "string" ? founder.adversarial_view.bear_case_summary : "No adversarial analysis is available.";
  return <div className="view">
    <div className="company-header"><div className="company-identity"><span className="company-logo">{founder.company_name[0]}</span><div><span className="section-kicker">{labelize(String(founder.raw_inputs.sector || "Unclassified"))} · {labelize(String(founder.raw_inputs.stage || "Unknown stage"))}</span><h1>{founder.company_name}</h1><p>{founder.name} · Owned by {company.owner}</p></div></div><div className="hero-actions"><button className="secondary-button" onClick={onMemo}><FileText size={15} /> Open memo</button><button className="primary-button" onClick={onDiligence}><ShieldCheck size={15} /> Continue diligence</button></div></div>
    <nav className="workspace-tabs" aria-label="Company workspace sections">{(["decision", "evidence", "risks"] as const).map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{labelize(item)}</button>)}</nav>
    {tab === "decision" && <div className="company-layout"><div className="company-main"><article className={`panel decision-summary ${decision.tone}`}><div className="decision-summary-head"><div><span className="section-kicker"><Lightbulb size={14} /> Current recommendation</span><h2>{decision.label}</h2><p>{decision.confidence} confidence · {decision.reason}</p></div><span className={`decision-chip ${decision.tone}`}>{company.stage}</span></div><div className="decision-columns"><div><h3>Why this could win</h3>{hypotheses.length ? hypotheses.map((item) => <p key={item}><Check size={15} />{item}</p>) : <p><AlertTriangle size={15} />No investment hypotheses cleared the evidence bar.</p>}</div><div><h3>Why this could fail</h3><p><AlertTriangle size={15} />{bearCase}</p></div></div><div className="next-action"><strong>Workflow</strong><select value={company.stage} onChange={(event) => updateCompany(founder.founder_id, { stage: event.target.value as PipelineStage })}>{PIPELINE_STAGES.map((stage) => <option key={stage}>{stage}</option>)}</select><select value={company.owner} onChange={(event) => updateCompany(founder.founder_id, { owner: event.target.value })}>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select></div></article></div><aside className="company-rail"><ScoreCard founder={founder} /><article className="panel evidence-health"><h2>Evidence health</h2><div><strong>{founder.source_evidence.length}</strong><span>source records</span></div><div><strong>{founder.trust_claims.length}</strong><span>extracted claims</span></div><div><strong>{founder.trust_claims.filter((claim) => claim.contradiction_flag).length}</strong><span>contradictions</span></div></article></aside></div>}
    {tab === "evidence" && <EvidenceLedger founder={founder} />}
    {tab === "risks" && <section className="risk-grid"><article className="panel risk-card critical"><AlertTriangle size={20} /><h2>Adversarial case</h2><p>{bearCase}</p></article><article className="panel risk-card"><ShieldCheck size={20} /><h2>Evidence gaps</h2><p>{founder.source_evidence.length ? `${founder.source_evidence.length} sources are attached; verify source independence and freshness.` : "No source evidence is attached. The decision is blocked."}</p></article><article className="panel risk-card"><TrendingUp size={20} /><h2>Model uncertainty</h2><p>Founder Score confidence is {Math.round(founder.founder_score.confidence * 100)}%. Model outputs remain advisory and require an investor decision.</p></article></section>}
  </div>;
}

function ScoreCard({ founder }: { founder: FounderRecord }) {
  return <article className="panel scorecard-compact"><span className="section-kicker"><Bot size={14} /> Model provenance</span><strong>{Math.round(founder.founder_score.value)}</strong><span>Provisional Founder Score</span><small>{Math.round(founder.founder_score.confidence * 100)}% confidence · {labelize(founder.founder_score.confidence_basis)}</small><small>Evaluated {formatDate(founder.timing.memo_ready_at)} · Review by Arjun Kapoor</small></article>;
}

function EvidenceLedger({ founder }: { founder: FounderRecord }) {
  const rows = [
    ...founder.source_evidence.map((source) => ({ type: "Source", title: source.title, status: "Attached", source: source.source, confidence: source.confidence, url: source.url, detail: source.content || "Public evidence record" })),
    ...founder.build_evidence.evidence_log.map((item) => ({ type: "Build check", title: item.signal, status: item.found ? "Verified" : "Not found", source: "Build evidence agent", confidence: item.found ? 0.9 : 0.4, url: item.source_url || "", detail: item.detail })),
    ...founder.trust_claims.map((claim) => ({ type: "Claim", title: claim.claim_text, status: claim.contradiction_flag ? "Contradicted" : labelize(claim.evidence_category), source: claim.source || "No citation", confidence: claim.confidence, url: "", detail: "Extracted from the investment record" })),
  ];
  return <section className="panel evidence-ledger"><div className="panel-heading"><div><h2>Evidence ledger</h2><p>Every claim and conclusion retains its provenance.</p></div><span className="status-pill">{rows.length} records</span></div><table><thead><tr><th>Record</th><th>Type</th><th>Status</th><th>Provenance</th><th>Confidence</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.type}-${index}`}><td><strong>{row.title}</strong><small>{row.detail}</small></td><td>{row.type}</td><td><span className={`evidence-status ${row.status === "Contradicted" || row.status === "Not found" ? "negative" : ""}`}>{row.status}</span></td><td>{row.url ? <a href={row.url} target="_blank" rel="noreferrer">{labelize(row.source)} <ArrowRight size={12} /></a> : row.source}</td><td>{Math.round(row.confidence * 100)}%</td></tr>)}</tbody></table>{!rows.length && <div className="inline-empty">No evidence records are attached.</div>}</section>;
}

function DiligenceWorkspace({ founder, workflow, reviewClaim, addTask, updateTask, onMemo }: { founder: FounderRecord | null; workflow: WorkspaceState; reviewClaim: (founderId: string, claimIndex: number, status: ClaimReviewStatus) => void; addTask: (founderId: string) => void; updateTask: (id: string, status: DiligenceTask["status"]) => void; onMemo: () => void }) {
  if (!founder) return <Empty title="Choose a company for diligence" detail="Open a company from the pipeline before starting claim review." />;
  const tasks = workflow.tasks.filter((task) => task.founderId === founder.founder_id);
  const audit = workflow.audit.filter((event) => event.founderId === founder.founder_id).slice(0, 8);
  return <div className="view"><section className="workflow-hero"><div><span className="section-kicker"><ShieldCheck size={14} /> {founder.company_name}</span><h1>Resolve the evidence that changes the decision.</h1><p>Approve, dispute, or request evidence for every material claim. Every action is recorded.</p></div><div className="hero-actions"><button className="secondary-button" onClick={() => addTask(founder.founder_id)}><Plus size={15} /> Add diligence task</button><button className="primary-button" onClick={onMemo}><FileText size={15} /> Open memo</button></div></section>
    <div className="diligence-workspace-grid"><section className="claims-review"><div className="section-heading"><div><h2>Claim review</h2><p>{founder.trust_claims.length} extracted claims · model outputs require reviewer action</p></div></div>{founder.trust_claims.map((claim, index) => { const review = workflow.claimReviews[`${founder.founder_id}:${index}`] ?? { status: "unreviewed", reviewer: "", updatedAt: "", note: "" }; return <article className="panel claim-review-card" key={`${claim.claim_text}-${index}`}><div className="claim-review-head"><span className="claim-index">{String(index + 1).padStart(2, "0")}</span><div><h3>{claim.claim_text}</h3><p>{claim.source || "No source citation"} · {Math.round(claim.confidence * 100)}% model confidence</p></div><span className={`review-state ${review.status}`}>{labelize(review.status)}</span></div><div className="claim-review-meta"><span>{labelize(claim.evidence_category)}</span><span>{claim.contradiction_flag ? "Contradiction detected" : "No contradiction flag"}</span><span>{review.updatedAt ? `${review.reviewer} · ${formatDate(review.updatedAt)}` : "Awaiting reviewer"}</span></div><div className="claim-review-actions"><button onClick={() => reviewClaim(founder.founder_id, index, "approved")}><Check size={14} /> Approve</button><button onClick={() => reviewClaim(founder.founder_id, index, "disputed")}><X size={14} /> Dispute</button><button onClick={() => reviewClaim(founder.founder_id, index, "evidence_requested")}><Search size={14} /> Request evidence</button></div></article>; })}{!founder.trust_claims.length && <div className="empty-state blocking"><AlertTriangle size={24} /><strong>Claim extraction incomplete</strong><p>No reviewable claims were produced. Create a manual diligence task or re-run intake.</p></div>}</section>
      <aside className="diligence-side"><article className="panel task-panel"><div className="panel-heading"><div><h2>Diligence tasks</h2><p>Owner, due date, and execution state</p></div></div>{tasks.map((task) => <div className="task-row" key={task.id}><span className={task.status}><ListChecks size={15} /></span><div><strong>{task.title}</strong><small>{task.owner} · due {formatDate(task.due)}</small></div><select value={task.status} onChange={(event) => updateTask(task.id, event.target.value as DiligenceTask["status"])}><option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option></select></div>)}{!tasks.length && <div className="inline-empty">No diligence tasks yet.</div>}</article><article className="panel audit-panel"><div className="panel-heading"><div><h2>Audit trail</h2><p>Human and model actions</p></div></div>{audit.map((event) => <div key={event.id}><span><Activity size={14} /></span><p><strong>{event.actor}</strong> {event.action}<small>{formatDate(event.timestamp)} · model provenance retained</small></p></div>)}{!audit.length && <div className="inline-empty">Reviewer actions will appear here.</div>}</article></aside></div>
  </div>;
}

function CompareCompanies({ founders }: { founders: FounderRecord[] }) {
  if (founders.length < 2) return <Empty title="Select at least two companies" detail="Use Pipeline multi-select to create a comparison." />;
  const criteria = [
    { label: "Founder Score", value: (founder: FounderRecord) => Math.round(founder.founder_score.value), type: "number" },
    { label: "Score confidence", value: (founder: FounderRecord) => `${Math.round(founder.founder_score.confidence * 100)}%`, type: "text" },
    { label: "Founder axis", value: (founder: FounderRecord) => Math.round(founder.axis_scores.founder?.score || 0), type: "number" },
    { label: "Market axis", value: (founder: FounderRecord) => Math.round(founder.axis_scores.market?.score || 0), type: "number" },
    { label: "Verified claims", value: (founder: FounderRecord) => founder.trust_claims.filter((claim) => claim.evidence_category === "known_verified" && !claim.contradiction_flag).length, type: "number" },
    { label: "Evidence records", value: (founder: FounderRecord) => founder.source_evidence.length, type: "number" },
    { label: "Recommendation", value: (founder: FounderRecord) => getDecision(founder).label, type: "text" },
  ];
  return <div className="view"><section className="workflow-hero"><div><span className="section-kicker"><BarChart3 size={14} /> Side-by-side decision support</span><h1>Compare the investment cases.</h1><p>Scores, evidence coverage, and recommendations remain separate so weak evidence cannot hide behind an average.</p></div></section><div className="comparison-grid" style={{ "--compare-count": founders.length } as React.CSSProperties}><div className="comparison-labels"><div className="comparison-company-spacer" />{criteria.map((item) => <div key={item.label}>{item.label}</div>)}</div>{founders.map((founder) => <article className="panel comparison-column" key={founder.founder_id}><div className="comparison-company"><Avatar founder={founder} /><h2>{founder.company_name}</h2><p>{founder.name} · {labelize(String(founder.raw_inputs.stage || "Unknown"))}</p></div>{criteria.map((item) => <div key={item.label}><strong>{item.value(founder)}</strong>{item.type === "number" && <i><b style={{ width: `${Math.min(100, Number(item.value(founder)) * (item.label.includes("claims") || item.label.includes("records") ? 12 : 1))}%` }} /></i>}</div>)}</article>)}</div></div>;
}

function MemoWorkspace({ founder, workflow, updateMemo }: { founder: FounderRecord | null; workflow: WorkspaceState; updateMemo: (founderId: string, action: "submit" | "approve" | "revise") => void }) {
  if (!founder) return <Empty title="Choose a company memo" detail="Open a company from Pipeline before reviewing its memo." />;
  const memo = workflow.memos[founder.founder_id] ?? { status: "draft", version: 1, reviewer: "Unassigned", updatedAt: new Date().toISOString(), note: "" };
  const snapshot = typeof founder.memo.company_snapshot === "string" ? founder.memo.company_snapshot : "No company snapshot was generated.";
  const hypotheses = Array.isArray(founder.memo.investment_hypotheses) ? founder.memo.investment_hypotheses.filter((item): item is string => typeof item === "string") : [];
  const exportMemo = () => {
    const text = `# ${founder.company_name} Investment Memo\n\nStatus: ${memo.status}\nVersion: ${memo.version}\n\n## Company snapshot\n${snapshot}\n\n## Investment hypotheses\n${hypotheses.map((item) => `- ${item}`).join("\n")}\n\n## Risks\n${String(founder.adversarial_view.bear_case_summary || "No adversarial analysis available.")}`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${founder.company_name.replace(/\s+/g, "-").toLowerCase()}-investment-memo-v${memo.version}.md`; anchor.click(); URL.revokeObjectURL(url);
  };
  return <div className="view memo-view"><section className="workflow-hero"><div><span className="section-kicker"><FileText size={14} /> Version {memo.version} · {labelize(memo.status)}</span><h1>{founder.company_name} investment memo</h1><p>AI-generated content remains a working draft until a named reviewer approves it.</p></div><div className="hero-actions"><button className="secondary-button" onClick={exportMemo}><Download size={15} /> Export Markdown</button>{memo.status === "draft" && <button className="primary-button" onClick={() => updateMemo(founder.founder_id, "submit")}>Submit for review</button>}{memo.status === "in_review" && <><button className="secondary-button" onClick={() => updateMemo(founder.founder_id, "revise")}>Request revision</button><button className="primary-button" onClick={() => updateMemo(founder.founder_id, "approve")}><Check size={15} /> Approve memo</button></>}</div></section>
    <div className="memo-layout"><article className="panel memo-document"><div className="memo-document-head"><span className={`memo-status ${memo.status}`}>{labelize(memo.status)}</span><span>Reviewer: {memo.reviewer}</span><span>Updated {formatDate(memo.updatedAt)}</span></div><section><h2>Company snapshot</h2><p>{snapshot}</p></section><section><h2>Investment thesis</h2>{hypotheses.map((item) => <p key={item}>• {item}</p>)}{!hypotheses.length && <p>No hypothesis cleared the evidence threshold.</p>}</section><section><h2>Adversarial view</h2><p>{String(founder.adversarial_view.bear_case_summary || "No adversarial analysis is available.")}</p></section><section><h2>Evidence and model provenance</h2><p>{founder.source_evidence.length} source records · {founder.trust_claims.length} extracted claims · Founder Score confidence {Math.round(founder.founder_score.confidence * 100)}%.</p><p>Generated by the VC Brain analysis pipeline. Final judgment: {memo.reviewer}.</p></section></article><aside className="memo-history panel"><div className="panel-heading"><div><h2>Version history</h2><p>Approval and revision record</p></div></div>{workflow.audit.filter((event) => event.founderId === founder.founder_id && event.action.includes("memo")).map((event) => <div key={event.id}><FileCheck2 size={15} /><p>{event.action}<small>{event.actor} · {formatDate(event.timestamp)}</small></p></div>)}<div><Bot size={15} /><p>Version 1 generated<small>VC Brain pipeline · {formatDate(founder.timing.memo_ready_at)}</small></p></div></aside></div>
  </div>;
}

function DecisionLab({ founders, workflow, saveScenario, onOpen, notify }: { founders: FounderRecord[]; workflow: WorkspaceState; saveScenario: (scenario: SavedScenario) => void; onOpen: (id: string) => void; notify: (message: string, tone?: Toast["tone"]) => void }) {
  const [weights, setWeights] = useState<ScenarioWeights>(DEFAULT_SCENARIO);
  const presets: Array<{ name: string; weights: ScenarioWeights }> = [
    { name: "Balanced", weights: DEFAULT_SCENARIO },
    { name: "Founder-first", weights: { founder: 50, market: 20, execution: 15, evidence: 15 } },
    { name: "Evidence-heavy", weights: { founder: 20, market: 20, execution: 20, evidence: 40 } },
    { name: "Market-first", weights: { founder: 20, market: 50, execution: 15, evidence: 15 } },
  ];
  const ranking = founders.map((founder) => ({ founder, ...getScenarioScore(founder, weights) })).sort((a, b) => b.score - a.score);
  const save = () => {
    const preset = presets.find((item) => JSON.stringify(item.weights) === JSON.stringify(weights));
    const scenario = { id: crypto.randomUUID(), name: preset?.name || `Custom scenario ${workflow.savedScenarios.length + 1}`, weights, createdAt: new Date().toISOString() };
    saveScenario(scenario); notify(`Saved ${scenario.name} to decision memory.`);
  };
  return <div className="view decision-lab"><section className="workflow-hero"><div><span className="section-kicker"><Scale size={14} /> Decision lab</span><h1>Stress-test conviction before it becomes consensus.</h1><p>Change the investment model, inspect rank sensitivity, and save the scenario with its assumptions.</p></div><button className="primary-button" onClick={save}><FileCheck2 size={15} /> Save scenario</button></section>
    <div className="lab-layout"><aside className="panel scenario-controls"><div className="panel-heading"><div><h2>Scenario assumptions</h2><p>Weights normalize automatically</p></div><span className="status-pill">{Object.values(weights).reduce((sum, value) => sum + value, 0)} total</span></div><div className="preset-row">{presets.map((preset) => <button key={preset.name} className={JSON.stringify(preset.weights) === JSON.stringify(weights) ? "active" : ""} onClick={() => setWeights(preset.weights)}>{preset.name}</button>)}</div><div className="weight-controls">{(Object.keys(weights) as Array<keyof ScenarioWeights>).map((key) => <label key={key}><span><strong>{labelize(key)}</strong><output>{weights[key]}%</output></span><input type="range" min="0" max="60" step="5" value={weights[key]} onChange={(event) => setWeights((current) => ({ ...current, [key]: Number(event.target.value) }))} /></label>)}</div>{workflow.savedScenarios.length > 0 && <div className="saved-scenarios"><strong>Saved scenarios</strong>{workflow.savedScenarios.slice(-4).reverse().map((scenario) => <button key={scenario.id} onClick={() => setWeights(scenario.weights)}><span>{scenario.name}</span><small>{formatDate(scenario.createdAt)}</small></button>)}</div>}</aside>
      <section className="panel scenario-results"><div className="panel-heading"><div><h2>Scenario ranking</h2><p>Transparent weighted score—not an investment recommendation</p></div><Radar size={19} /></div><div className="scenario-table" role="table" aria-label="Scenario ranking"><div className="scenario-row scenario-head" role="row"><span>Rank</span><span>Company</span><span>Founder</span><span>Market</span><span>Execution</span><span>Evidence</span><span>Scenario</span><span /></div>{ranking.map(({ founder, score, dimensions }, index) => { const delta = score - Math.round(founder.founder_score.value); const spread = Math.max(...Object.values(dimensions)) - Math.min(...Object.values(dimensions)); return <button className="scenario-row" role="row" key={founder.founder_id} onClick={() => onOpen(founder.founder_id)}><span className="scenario-rank">{index + 1}</span><span className="scenario-company"><Avatar founder={founder} small /><span><strong>{founder.company_name}</strong><small>{spread > 45 ? "Fragile across assumptions" : "Relatively balanced"}</small></span></span><span>{dimensions.founder}</span><span>{dimensions.market}</span><span>{dimensions.execution}</span><span>{dimensions.evidence}</span><span><strong>{score}</strong><small className={delta >= 0 ? "positive-delta" : "negative-delta"}>{delta >= 0 ? "+" : ""}{delta} vs base</small></span><ArrowRight size={14} /></button>; })}</div>{!ranking.length && <Empty title="No companies to model" detail="Add companies through Pitch Intake before running a decision scenario." />}</section></div>
    <article className="scenario-disclosure"><Target size={16} /><p><strong>Model boundary:</strong> this lab exposes sensitivity to explicit assumptions. It does not estimate investment returns or replace partner judgment.</p></article>
  </div>;
}

function InvestmentCommittee({ founders, workflow, onOpen, recordDecision, actorName }: { founders: FounderRecord[]; workflow: WorkspaceState; onOpen: (id: string) => void; recordDecision: (founder: FounderRecord, decision: ICDecision) => void; actorName: string }) {
  const agenda = founders.filter((founder) => (workflow.companies[founder.founder_id] ?? defaultWorkflow(founder)).stage === "IC");
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { outcome: ICDecision["outcome"]; rationale: string; dissent: string }>>({});
  const updateDraft = (id: string, patch: Partial<{ outcome: ICDecision["outcome"]; rationale: string; dissent: string }>) => setDrafts((current) => ({ ...current, [id]: { outcome: "hold", rationale: "", dissent: "", ...current[id], ...patch } }));
  return <div className="view"><section className="workflow-hero"><div><span className="section-kicker"><ClipboardCheck size={14} /> Investment committee</span><h1>Prepare decisions, not presentations.</h1><p>Every agenda item exposes recommendation, dissent, evidence gates, and an accountable final decision.</p></div><span className="status-pill">{agenda.length} agenda items</span></section><section className="ic-list">{agenda.map((founder, index) => { const recommendation = getDecision(founder); const memo = workflow.memos[founder.founder_id]; const existing = workflow.icDecisions[founder.founder_id]; const draft = drafts[founder.founder_id] ?? { outcome: "hold" as const, rationale: "", dissent: "" }; return <article className="panel ic-item" key={founder.founder_id}><span className="ic-order">{String(index + 1).padStart(2, "0")}</span><div><h2>{founder.company_name}</h2><p>{founder.name} · {labelize(String(founder.raw_inputs.sector || "Unclassified"))}</p></div><div><span>Recommendation</span><strong>{recommendation.label}</strong><small>{recommendation.reason}</small></div><div><span>Memo</span><strong>{memo ? labelize(memo.status) : "Draft"}</strong><small>{memo?.reviewer || "No reviewer"}</small></div><div><span>Dissent</span><strong>{founder.trust_claims.some((claim) => claim.contradiction_flag) ? "Recorded" : "None recorded"}</strong><small>{founder.trust_claims.filter((claim) => claim.contradiction_flag).length} contradiction flags</small></div><div className="ic-actions"><button className="secondary-button" onClick={() => onOpen(founder.founder_id)}>Evidence</button><button className="primary-button" onClick={() => setOpenId((current) => current === founder.founder_id ? null : founder.founder_id)}>{existing ? "View decision" : "Record decision"} <ArrowRight size={14} /></button></div>{openId === founder.founder_id && <div className="ic-decision-editor">{existing ? <div className="recorded-decision"><CheckCircle2 size={20} /><div><span>Final decision · {formatDate(existing.decidedAt)}</span><h3>{labelize(existing.outcome)}</h3><p>{existing.rationale}</p>{existing.dissent && <blockquote><MessageSquare size={15} />Dissent: {existing.dissent}</blockquote>}<small>{existing.decidedBy} · organization-shared decision record</small></div></div> : <><label><span>Final outcome</span><select value={draft.outcome} onChange={(event) => updateDraft(founder.founder_id, { outcome: event.target.value as ICDecision["outcome"] })}><option value="invest">Invest</option><option value="hold">Hold</option><option value="pass">Pass</option></select></label><label className="ic-rationale"><span>Decision rationale</span><textarea rows={3} value={draft.rationale} onChange={(event) => updateDraft(founder.founder_id, { rationale: event.target.value })} placeholder="State the decisive evidence and tradeoff…" /></label><label className="ic-rationale"><span>Dissent or minority view</span><textarea rows={3} value={draft.dissent} onChange={(event) => updateDraft(founder.founder_id, { dissent: event.target.value })} placeholder="Optional, but preserved with the decision" /></label><button className="primary-button" disabled={!draft.rationale.trim()} onClick={() => recordDecision(founder, { ...draft, decidedBy: actorName, decidedAt: new Date().toISOString() })}><FileCheck2 size={15} /> Commit decision</button></>}</div>}</article>; })}{!agenda.length && <Empty title="No companies are ready for IC" detail="Advance qualified companies from Pipeline after their evidence and memo gates are complete." />}</section></div>;
}

function Portfolio({ founders, workflow, onOpen, updateRules }: { founders: FounderRecord[]; workflow: WorkspaceState; onOpen: (id: string) => void; updateRules: (rules: Partial<AlertRules>) => void }) {
  const portfolio = founders.filter((founder) => (workflow.companies[founder.founder_id] ?? defaultWorkflow(founder)).stage === "Invest");
  const alerts = getPortfolioAlerts(founders, workflow);
  return <div className="view"><section className="workflow-hero"><div><span className="section-kicker"><BriefcaseBusiness size={14} /> Portfolio monitoring</span><h1>Track material changes after investment.</h1><p>Rules watch confidence, evidence freshness, contradictions, and founder-signal movement.</p></div><span className={`status-pill ${alerts.some((alert) => alert.severity === "critical") ? "attention" : ""}`}>{alerts.length} active alerts</span></section>
    <div className="portfolio-monitor-layout"><section className="panel alert-center"><div className="panel-heading"><div><h2>Material change queue</h2><p>Ordered by severity and decision impact</p></div><BellRing size={18} /></div>{alerts.map((alert) => <button className={`monitor-alert ${alert.severity}`} key={alert.id} onClick={() => onOpen(alert.founderId)}><span className="alert-severity">{alert.severity}</span><span><strong>{alert.company} · {alert.title}</strong><small>{alert.detail}</small></span><ArrowRight size={14} /></button>)}{!alerts.length && <div className="inline-empty">No portfolio rule is currently triggered.</div>}</section>
      <aside className="panel alert-rules"><div className="panel-heading"><div><h2>Monitoring rules</h2><p>Organization monitoring policy</p></div></div><label><span><strong>Confidence floor</strong><output>{workflow.alertRules.confidenceFloor}%</output></span><input type="range" min="50" max="90" step="5" value={workflow.alertRules.confidenceFloor} onChange={(event) => updateRules({ confidenceFloor: Number(event.target.value) })} /></label><label><span><strong>Evidence freshness</strong></span><select value={workflow.alertRules.staleEvidenceDays} onChange={(event) => updateRules({ staleEvidenceDays: Number(event.target.value) })}><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option><option value="180">180 days</option></select></label><label className="rule-toggle"><input type="checkbox" checked={workflow.alertRules.contradictions} onChange={(event) => updateRules({ contradictions: event.target.checked })} /><span><strong>Contradiction alerts</strong><small>Flag conflicts in material claims</small></span></label></aside></div>
    <div className="section-heading portfolio-heading"><div><h2>Active investments</h2><p>Monitoring context by company</p></div></div><section className="portfolio-grid">{portfolio.map((founder) => { const companyAlerts = alerts.filter((alert) => alert.founderId === founder.founder_id); return <button className="panel portfolio-card" key={founder.founder_id} onClick={() => onOpen(founder.founder_id)}><div><Avatar founder={founder} /><span><strong>{founder.company_name}</strong><small>{labelize(String(founder.raw_inputs.sector || "Unclassified"))}</small></span></div><div className="portfolio-metric"><span>Founder signal</span><strong>{Math.round(founder.founder_score.value)}</strong><small>{labelize(founder.founder_score.trend)}</small></div><div className={`portfolio-alert ${companyAlerts.length ? "attention" : ""}`}><BellRing size={15} /><span>{companyAlerts.length ? `${companyAlerts.length} monitoring ${companyAlerts.length === 1 ? "alert" : "alerts"}` : "No material alert"}</span></div></button>; })}{!portfolio.length && <Empty title="No active investments in this workspace" detail="Companies moved to Invest will appear here with monitoring signals." />}</section></div>;
}

function ResearchLibrary({ founders, signals, workflow }: { founders: FounderRecord[]; signals: Signal[]; workflow: WorkspaceState }) {
  const sources = founders.flatMap((founder) => founder.source_evidence.map((source) => ({ ...source, company: founder.company_name })));
  const decisions = Object.entries(workflow.icDecisions).map(([founderId, decision]) => ({ decision, founder: founders.find((founder) => founder.founder_id === founderId) })).filter((item): item is { decision: ICDecision; founder: FounderRecord } => Boolean(item.founder)).sort((a, b) => new Date(b.decision.decidedAt).getTime() - new Date(a.decision.decidedAt).getTime());
  return <div className="view"><section className="workflow-hero"><div><span className="section-kicker"><BookOpen size={14} /> Research library</span><h1>Institutional evidence, with provenance.</h1><p>Accepted evidence, reviewed signals, and prior decisions remain connected.</p></div></section><section className="research-grid"><article className="panel"><div className="panel-heading"><div><h2>Accepted source evidence</h2><p>Attached to company decision records</p></div><span className="status-pill">{sources.length}</span></div>{sources.slice(0, 12).map((source, index) => <a className="research-row" href={source.url} target="_blank" rel="noreferrer" key={`${source.url}-${index}`}><Globe2 size={15} /><span><strong>{source.title}</strong><small>{source.company} · {labelize(source.source)} · {Math.round(source.confidence * 100)}% confidence</small></span><ArrowRight size={14} /></a>)}{!sources.length && <div className="inline-empty">No source evidence has been accepted.</div>}</article><article className="panel"><div className="panel-heading"><div><h2>Reviewed sourcing signals</h2><p>Persisted after inbox review</p></div><span className="status-pill">{signals.length}</span></div>{signals.slice(0, 12).map((signal) => <a className="research-row" href={signal.source_url} target="_blank" rel="noreferrer" key={signal.signal_id}><Zap size={15} /><span><strong>{signal.title}</strong><small>{labelize(signal.source)} · observed {formatDate(signal.observed_at)}</small></span><ArrowRight size={14} /></a>)}</article><article className="panel decision-memory"><div className="panel-heading"><div><h2>Decision memory</h2><p>Final IC rationale and preserved dissent</p></div><span className="status-pill">{decisions.length}</span></div>{decisions.map(({ founder, decision }) => <div className="memory-row" key={founder.founder_id}><span className={`memory-outcome ${decision.outcome}`}>{labelize(decision.outcome)}</span><div><strong>{founder.company_name}</strong><p>{decision.rationale}</p>{decision.dissent && <small>Dissent: {decision.dissent}</small>}<small>{decision.decidedBy} · {formatDate(decision.decidedAt)}</small></div></div>)}{!decisions.length && <div className="inline-empty">Committed IC decisions will become searchable institutional memory.</div>}</article></section></div>;
}

function PitchIntake({ onCreated }: { onCreated: (id: string) => void }) {
  const [file, setFile] = useState<File | null>(null); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!file) return setMessage("Choose a pitch file."); const form = new FormData(event.currentTarget); form.set("pitch", file); setLoading(true); try { const response = await fetch(`${API_BASE}/founders/inbound/upload`, { method: "POST", body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.detail || "Pitch processing failed."); onCreated(data.founder_id); } catch (error) { setMessage(error instanceof Error ? error.message : "Pitch intake unavailable."); } finally { setLoading(false); } };
  return <div className="view workflow-view"><section className="workflow-hero"><div><span className="section-kicker"><Upload size={14} /> Inbound activation</span><h1>Review extraction before diligence.</h1><p>Create the company record, then inspect evidence and claims in the company workspace.</p></div></section><form className="panel intake-form" onSubmit={submit}><div className="form-grid"><label><span>Founder name</span><input name="name" required /></label><label><span>Company name</span><input name="company_name" required /></label><label><span>LinkedIn profile</span><input name="linkedin_url" type="url" /></label><label><span>GitHub handle</span><input name="github_handle" /></label><label><span>Sector</span><input name="sector" /></label><label><span>Stage</span><input name="stage" /></label><label className="full-field"><span>Geography</span><input name="geography" /></label></div><label className={`upload-zone ${file ? "has-file" : ""}`}><Upload size={24} /><strong>{file?.name || "Choose pitch deck"}</strong><span>PDF, TXT, or Markdown · maximum 10 MB</span><input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><button type="submit" className="primary-button wide intake-submit" disabled={loading}>{loading ? "Analyzing…" : "Upload and analyze"} <ArrowRight size={15} /></button>{message && <p className="workflow-message">{message}</p>}</form></div>;
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><BriefcaseBusiness size={24} /><strong>{title}</strong><p>{detail}</p></div>;
}

function QuickActions({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (view: View) => void }) {
  const [query, setQuery] = useState(""); const [activeIndex, setActiveIndex] = useState(0); const ref = useRef<HTMLDivElement>(null); const actionRefs = useRef<Array<HTMLButtonElement | null>>([]); const previous = useRef<HTMLElement | null>(null);
  useEffect(() => { if (!open) return; previous.current = document.activeElement as HTMLElement; const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); if (event.key === "Tab" && ref.current) { const items = [...ref.current.querySelectorAll<HTMLElement>("button,input")]; if (!items.length) return; if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); } } }; window.addEventListener("keydown", handler); return () => { window.removeEventListener("keydown", handler); previous.current?.focus(); }; }, [onClose, open]);
  if (!open) return null;
  const actions = [{ title: "Review sourcing signals", detail: "Inbox", view: "inbox" as View }, { title: "Open investment pipeline", detail: "Pipeline", view: "pipeline" as View }, { title: "Stress-test a decision", detail: "Decision Lab", view: "lab" as View }, { title: "Prepare investment committee", detail: "IC agenda", view: "ic" as View }, { title: "Upload a pitch deck", detail: "Inbound", view: "intake" as View }, { title: "Search institutional evidence", detail: "Research", view: "research" as View }].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
  const choose = (index: number) => { const action = actions[index]; if (action) { onSelect(action.view); onClose(); setQuery(""); setActiveIndex(0); } };
  const move = (direction: number) => {
    if (!actions.length) return;
    const next = (activeIndex + direction + actions.length) % actions.length;
    setActiveIndex(next);
    actionRefs.current[next]?.focus();
  };
  return <div className="dialog-backdrop" onMouseDown={onClose}><div className="search-dialog" ref={ref} role="dialog" aria-modal="true" aria-label="Quick actions" onMouseDown={(event) => event.stopPropagation()}><label><Search size={20} /><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); move(1); } else if (event.key === "ArrowUp") { event.preventDefault(); move(-1); } else if (event.key === "Enter") { event.preventDefault(); choose(activeIndex); } }} placeholder="Find a workflow" aria-label="Find a workflow" /><kbd>ESC</kbd></label><div className="dialog-content">{actions.map((action, index) => <button ref={(node) => { actionRefs.current[index] = node; }} className={index === activeIndex ? "active" : ""} key={action.title} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(index)}><span><Zap size={16} /></span><div><strong>{action.title}</strong><small>{action.detail}</small></div><ArrowRight size={15} /></button>)}{!actions.length && <div className="dialog-empty"><Search size={18} /><span>No workflow matches “{query}”.</span></div>}</div><p className="dialog-hint"><kbd>↑</kbd><kbd>↓</kbd> Navigate <kbd>↵</kbd> Open</p></div></div>;
}

export default function VCWorkspace({ currentUser }: { currentUser: AppUser }) {
  const [view, setView] = useState<View>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [founders, setFounders] = useState<FounderRecord[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [selectedFounderId, setSelectedFounderId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceState>(EMPTY_WORKSPACE);
  const [sessionUser, setSessionUser] = useState<SessionUser>(currentUser);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const workspaceReady = useRef(false);
  const workspaceVersion = useRef(0);
  const lastSavedWorkspace = useRef("");
  const skipNextSave = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [workspaceRefresh, setWorkspaceRefresh] = useState(0);
  const [online, setOnline] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = (message: string, tone: Toast["tone"] = "success") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }].slice(-3));
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500);
  };
  const navigate = (next: View, founderId?: string | null, ids: string[] = compareIds) => {
    const id = founderId === undefined ? selectedFounderId : founderId;
    window.history.pushState({}, "", routeFor(next, id, ids)); setView(next); if (founderId !== undefined) setSelectedFounderId(founderId); if (next === "compare") setCompareIds(ids);
  };
  const addAudit = (founderId: string, action: string) => setWorkspace((current) => ({ ...current, audit: [{ id: crypto.randomUUID(), founderId, actor: sessionUser.displayName, action, timestamp: new Date().toISOString() }, ...current.audit].slice(0, 100) }));
  const updateCompany = (id: string, patch: Partial<CompanyWorkflow>) => { setWorkspace((current) => ({ ...current, companies: { ...current.companies, [id]: { ...(current.companies[id] ?? defaultWorkflow(founders.find((founder) => founder.founder_id === id)!)), ...patch, updatedAt: new Date().toISOString() } } })); addAudit(id, `updated workflow: ${Object.entries(patch).map(([key, value]) => `${key} → ${value}`).join(", ")}`); };
  const saveView = (savedView: WorkspaceState["savedViews"][number]) => setWorkspace((current) => ({ ...current, savedViews: [...current.savedViews, savedView] }));
  const saveScenario = (scenario: SavedScenario) => setWorkspace((current) => ({ ...current, savedScenarios: [...current.savedScenarios, scenario].slice(-12) }));
  const updateAlertRules = (rules: Partial<AlertRules>) => setWorkspace((current) => ({ ...current, alertRules: { ...current.alertRules, ...rules } }));
  const recordICDecision = (founder: FounderRecord, decision: ICDecision) => {
    const stage: PipelineStage = decision.outcome === "invest" ? "Invest" : decision.outcome === "pass" ? "Pass" : "Partner review";
    setWorkspace((current) => ({ ...current, icDecisions: { ...current.icDecisions, [founder.founder_id]: decision }, companies: { ...current.companies, [founder.founder_id]: { ...(current.companies[founder.founder_id] ?? defaultWorkflow(founder)), stage, decision: labelize(decision.outcome), updatedAt: decision.decidedAt } } }));
    addAudit(founder.founder_id, `committed IC decision: ${decision.outcome}`);
    notify(`${founder.company_name}: ${labelize(decision.outcome)} decision committed.`);
  };
  const reviewClaim = (founderId: string, index: number, status: ClaimReviewStatus) => { const key = `${founderId}:${index}`; setWorkspace((current) => ({ ...current, claimReviews: { ...current.claimReviews, [key]: { status, reviewer: sessionUser.displayName, updatedAt: new Date().toISOString(), note: "" } } })); addAudit(founderId, `${labelize(status)} claim ${index + 1}`); notify(`Claim ${index + 1} marked ${labelize(status).toLowerCase()}.`); };
  const addTask = (founderId: string) => { const due = new Date(); due.setDate(due.getDate() + 7); setWorkspace((current) => ({ ...current, tasks: [...current.tasks, { id: crypto.randomUUID(), founderId, title: "Verify highest-impact unresolved claim", owner: sessionUser.displayName, due: due.toISOString(), status: "open" }] })); addAudit(founderId, "created a diligence task"); notify("Diligence task created."); };
  const updateTask = (id: string, status: DiligenceTask["status"]) => { const task = workspace.tasks.find((item) => item.id === id); setWorkspace((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === id ? { ...item, status } : item) })); if (task) addAudit(task.founderId, `marked diligence task ${labelize(status)}`); notify(`Task marked ${labelize(status).toLowerCase()}.`); };
  const updateMemo = (founderId: string, action: "submit" | "approve" | "revise") => { setWorkspace((current) => { const memo = current.memos[founderId] ?? { status: "draft" as const, version: 1, reviewer: "Unassigned", updatedAt: new Date().toISOString(), note: "" }; const next: MemoReview = action === "submit" ? { ...memo, status: "in_review", reviewer: sessionUser.displayName, updatedAt: new Date().toISOString() } : action === "approve" ? { ...memo, status: "approved", reviewer: sessionUser.displayName, updatedAt: new Date().toISOString() } : { ...memo, status: "draft", version: memo.version + 1, reviewer: sessionUser.displayName, updatedAt: new Date().toISOString() }; return { ...current, memos: { ...current.memos, [founderId]: next } }; }); addAudit(founderId, action === "submit" ? "submitted memo for review" : action === "approve" ? "approved investment memo" : "requested memo revision"); notify(action === "submit" ? "Memo submitted for review." : action === "approve" ? "Memo approved and recorded." : "Revision requested; a new draft version was created."); };

  useEffect(() => { const state = routeState(); queueMicrotask(() => { setView(state.view); setSelectedFounderId(state.founderId); setCompareIds(state.compareIds); }); const pop = () => { const next = routeState(); setView(next.view); setSelectedFounderId(next.founderId); setCompareIds(next.compareIds); }; window.addEventListener("popstate", pop); return () => window.removeEventListener("popstate", pop); }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/workspace", { signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Shared workspace unavailable");
      const serverWorkspace = normalizeWorkspace(data.workspace);
      let legacyWorkspace: WorkspaceState | null = null;
      try {
        const saved = localStorage.getItem("vc-brain-workspace-v1");
        if (data.version === 0 && saved) legacyWorkspace = normalizeWorkspace(JSON.parse(saved));
      } catch { /* ignore malformed legacy cache */ }
      workspaceVersion.current = Number(data.version || 0);
      setSessionUser((current) => ({ ...current, role: data.user.role, organizationName: data.organization.name }));
      const initialWorkspace = legacyWorkspace ?? serverWorkspace;
      lastSavedWorkspace.current = JSON.stringify(serverWorkspace);
      skipNextSave.current = !legacyWorkspace;
      workspaceReady.current = true;
      setWorkspace(initialWorkspace);
      setSyncStatus(legacyWorkspace ? "saving" : "saved");
      setWorkspaceError("");
    }).catch((reason) => {
      if (reason.name !== "AbortError") {
        setSyncStatus("error");
        setWorkspaceError(`Shared workspace unavailable: ${reason.message}`);
      }
    });
    return () => controller.abort();
  }, [workspaceRefresh]);
  useEffect(() => {
    if (!workspaceReady.current) return;
    const serialized = JSON.stringify(workspace);
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    if (serialized === lastSavedWorkspace.current) return;
    const timeout = window.setTimeout(async () => {
      setSyncStatus("saving");
      try {
        const response = await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspace, expectedVersion: workspaceVersion.current, action: "updated shared investment workspace" }) });
        const data = await response.json();
        if (response.status === 409) {
          const current = normalizeWorkspace(data.workspace);
          workspaceVersion.current = Number(data.version || 0);
          lastSavedWorkspace.current = JSON.stringify(current);
          skipNextSave.current = true;
          setWorkspace(current);
          setSyncStatus("conflict");
          notify("Another teammate saved first. Their latest workspace has been loaded.", "warning");
          return;
        }
        if (!response.ok) throw new Error(data.error || "Workspace sync failed");
        workspaceVersion.current = Number(data.version || workspaceVersion.current + 1);
        lastSavedWorkspace.current = serialized;
        localStorage.removeItem("vc-brain-workspace-v1");
        setSyncStatus("saved");
      } catch (reason) {
        setSyncStatus("error");
        notify(reason instanceof Error ? reason.message : "Workspace sync failed", "warning");
      }
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [workspace]);
  useEffect(() => { const controller = new AbortController(); Promise.all([fetch(`${API_BASE}/founders`, { signal: controller.signal }), fetch(`${API_BASE}/signals?limit=50`, { signal: controller.signal }), fetch(`${API_BASE}/dashboard/summary`, { signal: controller.signal })]).then(async ([founderResponse, signalResponse, summaryResponse]) => { if (!founderResponse.ok || !signalResponse.ok || !summaryResponse.ok) throw new Error("The VC Brain API returned an error."); const founderData: FounderRecord[] = await founderResponse.json(); const signalData = await signalResponse.json(); setFounders(founderData); setSignals(signalData.signals ?? []); setSummary(await summaryResponse.json()); setWorkspace((current) => ({ ...current, companies: { ...Object.fromEntries(founderData.map((founder) => [founder.founder_id, defaultWorkflow(founder)])), ...current.companies }, memos: { ...Object.fromEntries(founderData.map((founder) => [founder.founder_id, { status: "draft", version: 1, reviewer: "Unassigned", updatedAt: founder.timing.memo_ready_at || new Date().toISOString(), note: "" }])), ...current.memos } })); setSelectedFounderId((current) => current || founderData[0]?.founder_id || null); setError(""); }).catch((reason) => { if (reason.name !== "AbortError") setError(`${reason.message} The authenticated analysis service is unavailable.`); }).finally(() => setLoading(false)); return () => controller.abort(); }, [refresh]);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setQuickOpen(true); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);
  useEffect(() => { const updateOnline = () => setOnline(navigator.onLine); updateOnline(); window.addEventListener("online", updateOnline); window.addEventListener("offline", updateOnline); return () => { window.removeEventListener("online", updateOnline); window.removeEventListener("offline", updateOnline); }; }, []);

  const selectedFounder = founders.find((founder) => founder.founder_id === selectedFounderId) ?? null;
  const compareFounders = compareIds.map((id) => founders.find((founder) => founder.founder_id === id)).filter((founder): founder is FounderRecord => Boolean(founder));
  const diligenceCount = founders.reduce((total, founder) => total + founder.trust_claims.filter((claim, index) => (workspace.claimReviews[`${founder.founder_id}:${index}`]?.status ?? "unreviewed") === "unreviewed").length, 0);
  const ownerOptions = [...new Set([sessionUser.displayName, ...OWNERS])];
  const retry = () => { setLoading(true); setError(""); setWorkspaceError(""); setRefresh((value) => value + 1); setWorkspaceRefresh((value) => value + 1); };
  return <><main className="app-shell" aria-hidden={quickOpen || undefined}><Sidebar view={view} onNavigate={(next) => navigate(next)} open={navOpen} onClose={() => setNavOpen(false)} inboxCount={signals.length} diligenceCount={diligenceCount} user={sessionUser} /><div className="workspace"><Topbar view={view} onMenu={() => setNavOpen(true)} onQuickActions={() => setQuickOpen(true)} online={online} syncStatus={syncStatus} user={sessionUser} />
    {(workspaceError || error) && <ErrorBanner message={workspaceError || error} onRetry={retry} />}
    {loading ? <LoadingWorkspace /> : <>
    {view === "overview" && <Overview founders={founders} signals={signals} summary={summary} workflow={workspace} onOpen={(id) => navigate("company", id)} onNavigate={(next) => navigate(next)} />}
    {view === "inbox" && <SignalInbox persistedSignals={signals} onDataChanged={() => setRefresh((value) => value + 1)} onIntake={() => navigate("intake")} notify={notify} />}
    {view === "pipeline" && <Pipeline founders={founders} workflow={workspace} updateCompany={updateCompany} saveView={saveView} onOpen={(id) => navigate("company", id)} onCompare={(ids) => navigate("compare", null, ids)} notify={notify} owners={ownerOptions} />}
    {view === "company" && <CompanyWorkspace founder={selectedFounder} workflow={workspace} updateCompany={updateCompany} onDiligence={() => navigate("diligence", selectedFounderId)} onMemo={() => navigate("memo", selectedFounderId)} owners={ownerOptions} />}
    {view === "diligence" && <DiligenceWorkspace founder={selectedFounder} workflow={workspace} reviewClaim={reviewClaim} addTask={addTask} updateTask={updateTask} onMemo={() => navigate("memo", selectedFounderId)} />}
    {view === "compare" && <CompareCompanies founders={compareFounders} />}
    {view === "memo" && <MemoWorkspace founder={selectedFounder} workflow={workspace} updateMemo={updateMemo} />}
    {view === "ic" && <InvestmentCommittee founders={founders} workflow={workspace} onOpen={(id) => navigate("company", id)} recordDecision={recordICDecision} actorName={sessionUser.displayName} />}
    {view === "portfolio" && <Portfolio founders={founders} workflow={workspace} onOpen={(id) => navigate("company", id)} updateRules={updateAlertRules} />}
    {view === "research" && <ResearchLibrary founders={founders} signals={signals} workflow={workspace} />}
    {view === "lab" && <DecisionLab founders={founders} workflow={workspace} saveScenario={saveScenario} onOpen={(id) => navigate("company", id)} notify={notify} />}
    {view === "intake" && <PitchIntake onCreated={(id) => { notify("Pitch analyzed and company record created."); setRefresh((value) => value + 1); navigate("company", id); }} />}
    </>}
  </div></main><QuickActions open={quickOpen} onClose={() => setQuickOpen(false)} onSelect={(next) => navigate(next)} /><ToastRegion toasts={toasts} dismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} /></>;
}
