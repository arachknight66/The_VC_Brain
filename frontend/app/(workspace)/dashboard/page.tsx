"use client";

import { useDashboardSummary, useFounders, useSignals } from "@/hooks/use-api";
import { Sparkles, Plus, Search, TrendingUp, Activity, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: founders, isLoading: foundersLoading } = useFounders();

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      {/* Top Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            Intelligence Overview
          </h1>
          <p className="text-xs font-medium text-[var(--color-text-tertiary)] mt-0.5">
            Welcome back. You have {summary?.memo_ready || 3} pending analysis reports ready for partner review.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/signals">
            <Button variant="outline" className="rounded-xl text-xs font-semibold gap-1.5 py-2 px-4">
              <Plus size={14} />
              <span>New Search</span>
            </Button>
          </Link>
          <Link href="/copilot">
            <Button className="rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 py-2 px-4 shadow-sm shadow-blue-500/20">
              <Sparkles size={14} />
              <span>AI Insights</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Grid matching Reference Image 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2-Column Section: Recent Analyses & AI Curated */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Analyses Card */}
            <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-[var(--color-text-primary)]">Recent Analyses</h3>
                <Link href="/companies" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                  View All
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {foundersLoading ? (
                  <Skeleton className="h-24 w-full rounded-xl" />
                ) : (
                  founders?.slice(0, 3).map((f, i) => {
                    const status = i === 0 ? "IN PROGRESS" : i === 1 ? "COMPLETED" : "DRAFT";
                    const statusColor =
                      i === 0
                        ? "bg-blue-50 text-blue-600 border-blue-200"
                        : i === 1
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-slate-50 text-slate-600 border-slate-200";

                    return (
                      <Link
                        key={f.founder_id}
                        href={`/companies/${f.founder_id}`}
                        className="p-3 rounded-xl border border-[var(--color-border)] hover:border-blue-200 hover:bg-blue-50/20 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                            {f.company_name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[var(--color-text-primary)]">
                              {f.company_name}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-tertiary)]">
                              Full Diligence • 2h ago
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${statusColor}`}>
                          {status}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* AI Curated Card */}
            <div className="p-6 rounded-2xl bg-blue-50/40 border border-blue-100/80 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-base">
                <Sparkles size={16} />
                <span>AI Curated</span>
              </div>
              <span className="text-xs text-[var(--color-text-tertiary)] -mt-2">Top signals for your thesis.</span>

              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-blue-100 flex flex-col gap-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">CarbonTrace AI</span>
                    <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                      <Zap size={10} /> STRONG SIGNAL
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">SaaS • Climate Tech</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-blue-100 flex flex-col gap-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">Lumina Optics</span>
                    <span className="text-[10px] font-extrabold text-blue-600 flex items-center gap-0.5">
                      <TrendingUp size={10} /> FAST GROWTH
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">Hardware • Photonics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Watchlist Momentum Bottom Row */}
          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-4 shadow-sm">
            <h3 className="font-bold text-base text-[var(--color-text-primary)]">Watchlist Momentum</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl border border-[var(--color-border)] flex flex-col justify-between h-24">
                <div className="flex justify-between items-center">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    Q
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    +14%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">QuantumStream</span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">Fintech • Series B</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--color-border)] flex flex-col justify-between h-24">
                <div className="flex justify-between items-center">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    B
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    Stable
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">BioLayer</span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">MedTech • Seed</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--color-border)] flex flex-col justify-between h-24">
                <div className="flex justify-between items-center">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    E
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    +8%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">EtherNet</span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">Cybersec • Series A</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--color-border)] flex flex-col justify-between h-24">
                <div className="flex justify-between items-center">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    O
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    Hot
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">OrbitAI</span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">SpaceTech • Pre-Seed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1-Column Section: Live Market Feed & Pro Tip */}
        <div className="flex flex-col gap-6">
          {/* Live Market Feed Box */}
          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-5 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-base text-[var(--color-text-primary)]">
              <Activity size={18} className="text-blue-600" />
              <span>Live Market Feed</span>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1 border-l-2 border-blue-500 pl-3">
                <span className="font-bold text-[var(--color-text-primary)]">Founder Update</span>
                <p className="text-[var(--color-text-secondary)]">
                  <strong className="text-slate-800">James C.</strong> from Vertex AI just posted a new hiring roadmap.
                </p>
                <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                  12 minutes ago
                </span>
              </div>

              <div className="flex flex-col gap-1 border-l-2 border-emerald-500 pl-3">
                <span className="font-bold text-[var(--color-text-primary)]">Market Movement</span>
                <p className="text-[var(--color-text-secondary)]">
                  Sector <strong className="text-slate-800">PropTech</strong> saw a 12% funding spike in EMEA today.
                </p>
                <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                  45 minutes ago
                </span>
              </div>

              <div className="flex flex-col gap-1 border-l-2 border-purple-500 pl-3">
                <span className="font-bold text-[var(--color-text-primary)]">New Signal</span>
                <p className="text-[var(--color-text-secondary)]">
                  Stealth company <strong className="text-slate-800">&quot;Project Zenith&quot;</strong> registered 3 patents in Solid State batteries.
                </p>
                <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                  1 hour ago
                </span>
              </div>
            </div>
          </div>

          {/* Pro Tip Box */}
          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">PRO TIP</span>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Try searching &quot;Companies like SpaceX but in carbon capture&quot; for a quick mapping.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
