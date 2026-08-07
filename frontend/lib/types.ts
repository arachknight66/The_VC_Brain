/* ── Signal ── */
export type Signal = {
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
  status?: "raw" | "accepted" | "dismissed";
};

/* ── Trust Claims ── */
export type EvidenceCategory = "known_verified" | "statistical_association" | "unverifiable";
export type TrustClaim = {
  claim_text: string;
  confidence: number;
  evidence_category: EvidenceCategory;
  source: string | null;
  contradiction_flag: boolean;
};

/* ── Build Evidence ── */
export type BuildEvidenceTier = "verified_working" | "verified_submitted" | "unverifiable" | "not_applicable";
export type EvidenceLogEntry = { signal: string; found: boolean; detail: string; source_url: string | null };
export type BuildEvidence = {
  tier: BuildEvidenceTier;
  signals_checked: string[];
  evidence_log: EvidenceLogEntry[];
};

/* ── Source Evidence ── */
export type SourceEvidence = {
  source: string;
  title: string;
  url: string;
  content?: string;
  collected_at?: string;
  confidence: number;
};

/* ── Axis Scores ── */
export type AxisScore = {
  rating: string;
  score: number;
  trend: string;
  rationale: string;
};

/* ── Founder Score ── */
export type ScoreHistoryEntry = { timestamp: string; value: number; context: string };
export type FounderScore = {
  value: number;
  trend: "improving" | "stable" | "declining";
  confidence: number;
  confidence_basis: string | null;
  history: ScoreHistoryEntry[];
};

/* ── Memo ── */
export type InvestmentMemo = {
  company_snapshot?: string;
  investment_hypotheses?: string[];
  swot?: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  problem_and_product?: string;
  traction_and_kpis?: string;
  team_and_history?: string;
  technology_and_defensibility?: string;
  market_sizing?: string;
  competition?: string;
  financials_and_round_structure?: string;
  cap_table?: string;
  due_diligence_log?: string;
  exit_perspective?: string;
};

/* ── Adversarial View ── */
export type AdversarialView = {
  bear_case_summary?: string;
  key_risks?: string[];
  unresolved_red_flags?: string[];
  what_would_change_my_mind?: string;
};

/* ── Timing ── */
export type Timing = {
  signal_detected_at?: string;
  application_triggered_at?: string;
  memo_ready_at?: string;
  elapsed_seconds: number | null;
  stage_timings: Record<string, number>;
};

/* ── Founder Record (Master) ── */
export type FounderRecord = {
  founder_id: string;
  name: string;
  company_name: string;
  source_channel: string;
  first_seen_at?: string;
  last_updated_at?: string;
  screened_out: boolean;
  screened_out_reason: string | null;
  entity_resolution_confidence: number | null;
  raw_inputs: Record<string, string | boolean | null | string[]>;
  founder_score: FounderScore;
  axis_scores: Record<string, AxisScore>;
  build_evidence: BuildEvidence;
  trust_claims: TrustClaim[];
  source_evidence: SourceEvidence[];
  memo: InvestmentMemo;
  adversarial_view: AdversarialView;
  timing: Timing;
};

/* ── Dashboard Summary ── */
export type DashboardSummary = {
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

/* ── Briefing ── */
export type BriefingStep = { label: string; content: string; elapsed: number };
export type InvestorBriefing = { steps: BriefingStep[]; summary: string };

/* ── Chat ── */
export type ChatMessage = { id: string; role: "user" | "assistant" | "thinking"; label?: string; content: string };

/* ── Pipeline ── */
export type PipelineStage = "New" | "Qualified" | "Partner Review" | "Diligence" | "IC" | "Invest" | "Pass";
export const PIPELINE_STAGES: PipelineStage[] = ["New", "Qualified", "Partner Review", "Diligence", "IC", "Invest", "Pass"];

/* ── Navigation ── */
export type NavItem = { id: string; label: string; href: string; icon: string; group: string };
