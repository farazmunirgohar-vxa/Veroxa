import type {
  DataConfidence,
  MonthlyReport,
  ReportMetric,
  WeeklyReport,
} from "./types";
import {
  toClientSafeMonthlyReport,
  toClientSafeWeeklyReport,
} from "./clientSafe";

export interface WeeklyReportDraftInput {
  id: string;
  clientId: string;
  weekStart: string;
  weekEnd: string;
  postsPlanned: number;
  postsPublished: number;
  uploadsReceived?: number | null;
  topContentSummary?: string;
  realTrendIndicators?: ReportMetric[];
  now?: string;
}

export interface MonthlyReportDraftInput {
  id: string;
  clientId: string;
  monthKey: string;
  summary?: string;
  insights?: string[];
  opportunities?: string[];
  nextMonthPlan?: string[];
  clientActions?: string[];
  metrics?: ReportMetric[];
  now?: string;
}

export function normalizeWeeklyReport(
  input: WeeklyReportDraftInput,
): WeeklyReport {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id,
    clientId: input.clientId,
    createdAt: now,
    updatedAt: now,
    status: "team_validation",
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    postsPlanned: Math.max(0, input.postsPlanned),
    postsPublished: Math.max(0, input.postsPublished),
    uploadsReceived: input.uploadsReceived ?? null,
    topContentSummary: input.topContentSummary,
    trendIndicators: input.realTrendIndicators ?? [
      unavailableMetric("Performance trend"),
    ],
  };
}

export function normalizeMonthlyReport(
  input: MonthlyReportDraftInput,
): MonthlyReport {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id,
    clientId: input.clientId,
    createdAt: now,
    updatedAt: now,
    status: "team_drafted",
    monthKey: input.monthKey,
    summary:
      input.summary ?? "Veroxa is preparing this month's account summary.",
    insights: input.insights ?? [],
    opportunities: input.opportunities ?? [],
    nextMonthPlan: input.nextMonthPlan ?? [],
    clientActions: input.clientActions ?? [],
    metrics: input.metrics ?? [unavailableMetric("Monthly performance")],
  };
}

export function unavailableMetric(
  label: string,
  note = "Real performance data is not available yet.",
): ReportMetric {
  return { label, value: null, confidence: "unavailable", note };
}

export function buildSafeWeeklyReport(report: WeeklyReport) {
  return toClientSafeWeeklyReport(report);
}

export function buildSafeMonthlyReport(report: MonthlyReport) {
  return toClientSafeMonthlyReport(report);
}

export function hasOnlySafeMetricConfidence(metrics: ReportMetric[]): boolean {
  const allowed: DataConfidence[] = ["real", "demo", "sample", "unavailable"];
  return metrics.every((metric) => allowed.includes(metric.confidence));
}
