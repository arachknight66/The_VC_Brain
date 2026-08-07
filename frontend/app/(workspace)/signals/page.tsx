"use client";

import { useState } from "react";
import { Search, Sparkles, Filter, Bookmark, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFounders, useSignals } from "@/hooks/use-api";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: founders, isLoading } = useFounders();
  const { data: signalsData } = useSignals();

  const smartSuggestions = ["Repeat Founders", "Ivy League Grads", "Climate Tech", "AI Infrastructure"];
  const filters = ["Industry", "Stage", "Background", "Geography"];

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      {/* Hero Discovery Search Header */}
      <div className="flex flex-col items-center text-center gap-4 py-6">
        <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
          Discover the Next Big Founder
        </h1>
        <p className="text-sm text-[var(--color-text-tertiary)] max-w-md">
          Ask The VC Brain to find specific talent profiles or emerging startups across deep tech, AI, and biotech.
        </p>

        {/* Large Central Search Input */}
        <div className="w-full max-w-2xl mt-2 relative flex items-center">
          <div className="absolute left-4 text-blue-600">
            <Sparkles size={20} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g., 'Founders in San Francisco building B2B AI...'"
            className="w-full pl-12 pr-32 py-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <button className="absolute right-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2">
            <span>Search</span>
          </button>
        </div>

        {/* Smart Suggestion Chips */}
        <div className="flex items-center gap-2.5 mt-2 flex-wrap justify-center text-xs">
          <span className="text-[var(--color-text-tertiary)] font-medium">Smart Suggestions:</span>
          {smartSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setSearchQuery(suggestion)}
              className="px-3.5 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-blue-300 hover:text-blue-600 transition-all font-medium"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Tab Section */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 flex-wrap gap-4">
        <div className="flex items-center gap-6 font-semibold text-sm">
          <span className="text-blue-600 border-b-2 border-blue-600 pb-4 -mb-4">Recent Searches</span>
          <span className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer pb-4 -mb-4">
            Saved Searches
          </span>
        </div>

        <div className="flex items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] font-medium flex items-center gap-1.5"
            >
              <span>{filter}</span>
              <span className="text-[10px]">▼</span>
            </button>
          ))}
          <button className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]">
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* Founder Discovery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ))
        ) : (
          founders?.slice(0, 6).map((founder, index) => {
            const matchScore = Math.min(98, Math.max(82, Math.round(founder.founder_score?.value || 88)));
            return (
              <motion.div
                key={founder.founder_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5"
              >
                {/* Profile Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-lg border border-slate-200">
                      {founder.name[0]}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-bold text-base text-[var(--color-text-primary)]">{founder.name}</h3>
                      <span className="text-xs text-blue-600 font-medium">🏢 {founder.company_name}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                    {matchScore}% Match
                  </span>
                </div>

                {/* AI Insight Highlight Box */}
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/80 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-blue-700 block mb-1">AI Insight:</span>
                  {founder.axis_scores?.founder?.rationale ||
                    `Repeat founder building high-moat infrastructure; verified build tier: ${founder.build_evidence?.tier}.`}
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" className="flex-1 rounded-xl text-xs font-semibold gap-1.5">
                    <Bookmark size={13} />
                    <span>Save</span>
                  </Button>
                  <Link href={`/companies/${founder.founder_id}`} className="flex-1">
                    <Button className="w-full rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                      <Sparkles size={13} />
                      <span>Analyze</span>
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
