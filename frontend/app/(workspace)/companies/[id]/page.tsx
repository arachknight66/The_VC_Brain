"use client";

import { useFounder } from "@/hooks/use-api";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  Sparkles,
  Share2,
  PlusCircle,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: founder, isLoading } = useFounder(id);
  const [activeTab, setActiveTab] = useState<"overview" | "diligence" | "memo">("overview");

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6 w-full">
        <Skeleton className="h-16 w-1/3 rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const companyName = founder?.company_name || "NeuroStream AI";
  const founderName = founder?.name || "Dr. Sarah Chen";
  const stage = String(founder?.raw_inputs?.stage || "Series B").toUpperCase();
  const sector = String(founder?.raw_inputs?.sector || "Infrastructure & AI");
  const geography = String(founder?.raw_inputs?.geography || "San Francisco, CA");

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      {/* Company Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 font-bold text-2xl border border-slate-200 shadow-sm">
            {companyName[0]}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">{companyName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 uppercase">
                {stage}
              </span>
            </div>
            <span className="text-xs font-medium text-[var(--color-text-tertiary)] mt-0.5">
              {sector} • {geography}
            </span>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl text-xs font-semibold gap-1.5 py-2 px-4">
            <Share2 size={14} />
            <span>Share</span>
          </Button>
          <Button className="rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 py-2 px-4 shadow-sm shadow-blue-500/20">
            <PlusCircle size={15} />
            <span>Add to Diligence</span>
          </Button>
        </div>
      </div>

      {/* Grid Layout matching Reference Image 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2-Column Section: Intelligence Executive Summary */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-100/90 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <Sparkles size={16} />
              <span>Intelligence Executive Summary</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              {founder?.memo?.company_snapshot ||
                `${companyName} is developing a proprietary low-latency inference engine specifically optimized for edge-computing environments. Unlike traditional cloud-based LLMs, their architecture achieves a 40% reduction in power consumption while maintaining parity with GPT-4 class benchmarks.`}
            </p>

            {/* Badges Bar */}
            <div className="flex items-center gap-3 flex-wrap pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] font-semibold text-emerald-700 shadow-xs">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Technical Moat: High
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-amber-200 text-[11px] font-semibold text-amber-700 shadow-xs">
                <AlertTriangle size={13} className="text-amber-600" />
                Execution Risk: Medium
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-blue-200 text-[11px] font-semibold text-blue-700 shadow-xs">
                <Clock size={13} className="text-blue-600" />
                Market Timing: Optimal
              </span>
            </div>
          </div>

          {/* Funding History Table */}
          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[var(--color-text-primary)]">Funding History</h3>
              <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">Total Raised: $42.5M</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] uppercase text-[10px] font-semibold">
                    <th className="py-2.5 px-2">Round</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Amount</th>
                    <th className="py-2.5 px-2">Lead Investors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] font-medium">
                  <tr>
                    <td className="py-3 px-2 font-bold text-[var(--color-text-primary)]">Series B</td>
                    <td className="py-3 px-2 text-[var(--color-text-secondary)]">Jan 2024</td>
                    <td className="py-3 px-2 font-bold text-slate-800">$28.0M</td>
                    <td className="py-3 px-2 text-[var(--color-text-secondary)]">Andreessen Horowitz</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2 font-bold text-[var(--color-text-primary)]">Series A</td>
                    <td className="py-3 px-2 text-[var(--color-text-secondary)]">Mar 2022</td>
                    <td className="py-3 px-2 font-bold text-slate-800">$12.0M</td>
                    <td className="py-3 px-2 text-[var(--color-text-secondary)]">Sequoia Capital</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2 font-bold text-[var(--color-text-primary)]">Seed</td>
                    <td className="py-3 px-2 text-[var(--color-text-secondary)]">Jun 2021</td>
                    <td className="py-3 px-2 font-bold text-slate-800">$2.5M</td>
                    <td className="py-3 px-2 text-[var(--color-text-secondary)]">Y Combinator</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1-Column Section: Product & Market + Founding Team */}
        <div className="flex flex-col gap-6">
          {/* Product & Market Box */}
          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-4 shadow-sm">
            <h3 className="font-bold text-base text-[var(--color-text-primary)]">Product & Market</h3>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Core Offering
              </span>
              <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                Edge-native LLM orchestration layer and hardware-agnostic compiler.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 pt-2">
              <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                TAM / SAM
              </span>
              <span className="text-sm font-extrabold text-[var(--color-text-primary)]">$14.2B / $2.8B</span>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full w-2/3"></div>
              </div>
            </div>
            <Link
              href="#"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 pt-2"
            >
              <span>View Competitor Matrix</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Founding Team Box */}
          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-4 shadow-sm">
            <h3 className="font-bold text-base text-[var(--color-text-primary)]">Founding Team</h3>
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                  {founderName[0]}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">{founderName}</span>
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">CEO, Ex-NVIDIA</span>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                  M
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">Marcus Thorne</span>
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">CTO, PhD Stanford</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
