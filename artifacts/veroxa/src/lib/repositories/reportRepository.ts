/**
 * reportRepository.ts — read-only adapter that maps demo weekly /
 * monthly report fixtures into the report contracts.
 *
 * Read-only. No writes. No network.
 */

import {
  demoWeeklyReports,
  type DemoWeeklyReport,
  type WeeklyReportStatus,
} from "@/data/demo/demoWeeklyReports";
import {
  demoMonthlyReports,
  type DemoMonthlyReport,
} from "@/data/demo/demoMonthlyReports";
import type {
  MonthlyReportSummary,
  ReportStatus,
  WeeklyReportSummary,
} from "@/lib/data/veroxaDataContracts";

function mapWeeklyStatus(s: WeeklyReportStatus): ReportStatus {
  switch (s) {
    case "Draft":
      return "drafted";
    case "Operator Review":
      return "operator_review";
    case "Ready for Client":
      return "approved";
    case "Published":
      return "published";
    default:
      return "drafted";
  }
}

function pickMetric(metrics: { label: string; value: string }[], label: string): number {
  const found = metrics.find((m) => m.label.toLowerCase().includes(label.toLowerCase()));
  if (!found) return 0;
  const n = Number(found.value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function toWeekly(r: DemoWeeklyReport, idx: number): WeeklyReportSummary {
  const [start, end] = r.weekRange.split("–").map((s) => s.trim());
  return {
    reportId: `wr-${r.clientId}-${idx}`,
    clientId: r.clientId,
    weekStart: start ?? r.weekRange,
    weekEnd: end ?? r.weekRange,
    postsPlanned: pickMetric(r.metrics, "Posts published"),
    postsPublished: pickMetric(r.metrics, "Posts published"),
    reach: 0,
    engagement: 0,
    googleViews: pickMetric(r.metrics, "Google profile updates"),
    googleCalls: 0,
    googleDirections: 0,
    uploadsReceived: pickMetric(r.metrics, "Approved media remaining"),
    status: mapWeeklyStatus(r.status),
  };
}

function toMonthly(r: DemoMonthlyReport, idx: number): MonthlyReportSummary {
  const totalPosts = pickMetric(r.contentPerformance, "Posts published");
  return {
    reportId: `mr-${r.clientId}-${idx}`,
    clientId: r.clientId,
    monthKey: r.monthLabel,
    status: "approved",
    totalPosts,
    totalReach: 0,
    totalEngagement: 0,
    googleViews: r.visibilityTrend.at(-1)?.value ?? 0,
    googleCalls: 0,
    googleDirections: 0,
    keyInsights: r.strategicNotes,
    nextMonthPlan: r.nextMonthFocus,
    operatorApprovalRequired: r.healthSummary.toLowerCase().includes("attention") ||
      r.healthSummary.toLowerCase().includes("critical"),
  };
}

export function getWeeklyReports(): WeeklyReportSummary[] {
  return demoWeeklyReports.map(toWeekly);
}

export function getMonthlyReports(): MonthlyReportSummary[] {
  return demoMonthlyReports.map(toMonthly);
}

export interface ClientReportsBundle {
  weekly: WeeklyReportSummary[];
  monthly: MonthlyReportSummary[];
}

export function getClientReports(clientId: string): ClientReportsBundle {
  return {
    weekly: getWeeklyReports().filter((r) => r.clientId === clientId),
    monthly: getMonthlyReports().filter((r) => r.clientId === clientId),
  };
}

export function getReportsNeedingTeamValidation(): WeeklyReportSummary[] {
  return getWeeklyReports().filter((r) => r.status === "drafted");
}

export function getMonthlyReportsNeedingOperatorApproval(): MonthlyReportSummary[] {
  return getMonthlyReports().filter((r) => r.operatorApprovalRequired);
}

export interface OwnerReportingSummary {
  weeklyTotal: number;
  weeklyAwaitingOperator: number;
  weeklyReadyForClient: number;
  weeklyPublished: number;
  monthlyTotal: number;
  monthlyNeedingApproval: number;
}

export function getOwnerReportingSummary(): OwnerReportingSummary {
  const w = getWeeklyReports();
  const m = getMonthlyReports();
  return {
    weeklyTotal: w.length,
    weeklyAwaitingOperator: w.filter((r) => r.status === "operator_review").length,
    weeklyReadyForClient: w.filter((r) => r.status === "approved").length,
    weeklyPublished: w.filter((r) => r.status === "published").length,
    monthlyTotal: m.length,
    monthlyNeedingApproval: m.filter((r) => r.operatorApprovalRequired).length,
  };
}
