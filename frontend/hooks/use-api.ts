"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDashboardSummary,
  fetchFounders,
  fetchFounder,
  fetchFounderBriefing,
  fetchSignals,
  sendChat,
  fetchHealthCheck,
} from "@/lib/api";

/* ── Query Keys ── */
export const queryKeys = {
  dashboard: ["dashboard-summary"] as const,
  founders: ["founders"] as const,
  founder: (id: string) => ["founder", id] as const,
  briefing: (id: string) => ["briefing", id] as const,
  signals: (source?: string) => ["signals", source] as const,
  health: ["health"] as const,
};

/* ── Dashboard ── */
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboardSummary,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/* ── Founders ── */
export function useFounders() {
  return useQuery({
    queryKey: queryKeys.founders,
    queryFn: fetchFounders,
    staleTime: 30_000,
  });
}

export function useFounder(id: string | null) {
  return useQuery({
    queryKey: queryKeys.founder(id || ""),
    queryFn: () => fetchFounder(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

/* ── Briefing ── */
export function useBriefing(founderId: string | null) {
  return useQuery({
    queryKey: queryKeys.briefing(founderId || ""),
    queryFn: () => fetchFounderBriefing(founderId!),
    enabled: Boolean(founderId),
    staleTime: 5 * 60_000,
  });
}

/* ── Signals ── */
export function useSignals(source?: string) {
  return useQuery({
    queryKey: queryKeys.signals(source),
    queryFn: () => fetchSignals(source),
    staleTime: 30_000,
  });
}

/* ── Chat Mutation ── */
export function useChat(founderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ message, briefingSteps }: { message: string; briefingSteps?: { label: string; content: string; elapsed?: number }[] }) =>
      sendChat(founderId, message, briefingSteps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.founder(founderId) });
    },
  });
}

/* ── Health Check ── */
export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: fetchHealthCheck,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}
