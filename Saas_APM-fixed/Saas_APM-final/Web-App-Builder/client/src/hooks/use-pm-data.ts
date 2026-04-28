import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertEvent, type InsertFeedback } from "@shared/schema";

type EventQueryInput = Partial<{
  type: string;
  userId: string;
  urlContains: string;
  from: string;
  to: string;
  limit: number;
  offset: number;
}>;

type FeedbackQueryInput = Partial<{
  sentiment: "positive" | "neutral" | "negative";
  source: string;
  userId: string;
  query: string;
  from: string;
  to: string;
  limit: number;
  offset: number;
}>;

// Stats
export function useStats(window: "24h" | "7d" | "30d" | "all" = "all") {
  return useQuery({
    queryKey: [api.stats.get.path, window],
    queryFn: async () => {
      const res = await fetch(`${api.stats.get.path}?window=${window}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.get.responses[200].parse(await res.json());
    },
    refetchInterval: 10000, // Real-time feel
  });
}

// Events
export function useEvents() {
  return useQuery({
    queryKey: [api.events.list.path],
    queryFn: async () => {
      const res = await fetch(api.events.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      return api.events.list.responses[200].parse(await res.json());
    },
  });
}

export function useEventsQuery(params: EventQueryInput) {
  return useQuery({
    queryKey: [api.events.query.path, params],
    queryFn: async () => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
      });
      const res = await fetch(`${api.events.query.path}?${search.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to query events");
      return api.events.query.responses[200].parse(await res.json());
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertEvent) => {
      const res = await fetch(api.events.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create event");
      return api.events.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
    },
  });
}

// Feedback
export function useFeedback() {
  return useQuery({
    queryKey: [api.feedback.list.path],
    queryFn: async () => {
      const res = await fetch(api.feedback.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch feedback");
      return api.feedback.list.responses[200].parse(await res.json());
    },
  });
}

export function useFeedbackQuery(params: FeedbackQueryInput) {
  return useQuery({
    queryKey: [api.feedback.query.path, params],
    queryFn: async () => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
      });
      const res = await fetch(`${api.feedback.query.path}?${search.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to query feedback");
      return api.feedback.query.responses[200].parse(await res.json());
    },
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFeedback) => {
      const res = await fetch(api.feedback.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create feedback");
      return api.feedback.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.feedback.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.feedback.query.path] });
    },
  });
}

// Recommendations
export function useRecommendations() {
  return useQuery({
    queryKey: [api.recommendations.list.path],
    queryFn: async () => {
      const res = await fetch(api.recommendations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      return api.recommendations.list.responses[200].parse(await res.json());
    },
  });
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.recommendations.generate.path, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate recommendations");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recommendations.list.path] });
    },
  });
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const path = api.recommendations.update.path.replace(":id", String(id));
      const res = await fetch(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update recommendation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recommendations.list.path] });
    },
  });
}

export function useRecommendationScoring(id: number | null) {
  return useQuery({
    queryKey: [api.recommendations.scoring.path, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const path = api.recommendations.scoring.path.replace(":id", String(id));
      const res = await fetch(path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load scoring details");
      return res.json();
    },
  });
}

// ── Error Tracking ────────────────────────────────────────────────────────────

export type ErrorSummary = {
  totalRequests: number;
  totalErrors: number;
  errorRatePercent: number;
  recentErrors: Array<{
    timestamp: string;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    message?: string;
    context?: Record<string, unknown>;
  }>;
};

export function useErrorsData() {
  return useQuery<ErrorSummary>({
    queryKey: ["/api/errors"],
    queryFn: async () => {
      const res = await fetch("/api/errors", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch error telemetry");
      return res.json();
    },
    refetchInterval: 15000,
  });
}

// ── Performance Telemetry ─────────────────────────────────────────────────────

export type RoutePerf = {
  path: string;
  requestCount: number;
  errorCount: number;
  errorRatePercent: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
};

export type PerformanceSummary = {
  routes: RoutePerf[];
  summary: ErrorSummary;
};

export function usePerformanceData() {
  return useQuery<PerformanceSummary>({
    queryKey: ["/api/performance"],
    queryFn: async () => {
      const res = await fetch("/api/performance", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch performance telemetry");
      return res.json();
    },
    refetchInterval: 15000,
  });
}
