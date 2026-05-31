import { getFirstClientReadinessChecks, getRecommendedNextReadinessAction } from "./checklist";
import type { FirstClientReadinessSummary, ReadinessArea, ReadinessAreaSummary, ReadinessCheck, ReadinessStatus } from "./types";

const readinessAreas: readonly ReadinessArea[] = [
  "client_portal",
  "team_portal",
  "media_workflow",
  "client_requests",
  "client_updates",
  "reports",
  "workflow_tracking",
  "approval_gates",
  "data_readiness",
  "launch_guardrails",
  "pricing_alignment",
  "role_separation",
  "service_boundaries",
];

export function getReadinessCompletionPercentage(checks: readonly ReadinessCheck[] = getFirstClientReadinessChecks()): number {
  if (checks.length === 0) return 0;
  const passing = checks.filter((check) => check.status === "passing").length;
  return Math.round((passing / checks.length) * 100);
}

export function getReadinessStatusFromChecks(checks: readonly ReadinessCheck[]): ReadinessStatus {
  const hasFailingBlocker = checks.some((check) => check.severity === "blocker" && check.status === "failing");
  if (hasFailingBlocker) return "blocked";

  const hasFailing = checks.some((check) => check.status === "failing");
  if (hasFailing) return "caution";

  const hasWarnings = checks.some((check) => check.status === "warning");
  if (hasWarnings) return "caution";

  const hasMinorWarnings = checks.some((check) => check.severity === "warning");
  if (hasMinorWarnings) return "ready_for_review";

  return "ready";
}

export function getReadinessAreaSummaries(checks: readonly ReadinessCheck[] = getFirstClientReadinessChecks()): readonly ReadinessAreaSummary[] {
  return readinessAreas
    .map((area) => {
      const areaChecks = checks.filter((check) => check.area === area);
      const warningChecks = areaChecks.filter((check) => check.status === "warning" || check.severity === "warning").length;
      const blockingChecks = areaChecks.filter((check) => check.severity === "blocker" && check.status !== "passing").length;
      return {
        area,
        totalChecks: areaChecks.length,
        passingChecks: areaChecks.filter((check) => check.status === "passing").length,
        warningChecks,
        blockingChecks,
        status: getReadinessStatusFromChecks(areaChecks),
      } satisfies ReadinessAreaSummary;
    })
    .filter((summary) => summary.totalChecks > 0);
}

export function getReadinessSummary(checks: readonly ReadinessCheck[] = getFirstClientReadinessChecks()): FirstClientReadinessSummary {
  return {
    totalChecks: checks.length,
    passingChecks: checks.filter((check) => check.status === "passing").length,
    warningChecks: checks.filter((check) => check.status === "warning" || check.severity === "warning").length,
    blockingChecks: checks.filter((check) => check.severity === "blocker" && check.status !== "passing").length,
    completionPercentage: getReadinessCompletionPercentage(checks),
    overallStatus: getReadinessStatusFromChecks(checks),
    recommendedNextAction: getRecommendedNextReadinessAction(checks),
    areaSummaries: getReadinessAreaSummaries(checks),
  };
}
