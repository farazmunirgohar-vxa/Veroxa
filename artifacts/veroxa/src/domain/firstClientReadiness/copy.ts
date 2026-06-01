import type { ReadinessArea, ReadinessSeverity, ReadinessStatus } from "./types";

export const READINESS_SAFE_COPY = {
  teamReview: "Veroxa team review",
  moreContentNeeded: "More content needed",
  preparedByVeroxa: "Prepared by Veroxa",
  needsInput: "Needs your input",
  includedInReport: "Included in report",
  liveDataPreparing: "Live account data is being prepared",
  nothingLiveWithoutReview: "Nothing goes live without Veroxa team review",
  asksForNext: "Veroxa will ask for anything needed next",
  manualReviewRequired: "Manual review required",
  readyForFirstClientReview: "Ready for first-client review",
  needsSetupBeforeLaunch: "Needs setup before client launch",
} as const;

const statusLabels: Record<ReadinessStatus, string> = {
  passing: "Benchmark OK",
  warning: "Needs attention",
  failing: "Needs setup before client launch",
  blocked: "Blocked",
  caution: "Caution",
  ready_for_review: "Ready for benchmark review",
  ready: "Benchmark ready",
};

const severityLabels: Record<ReadinessSeverity, string> = {
  blocker: "Manual review required",
  warning: "Needs attention",
  pass: "Ready for first-client review",
};

const areaLabels: Record<ReadinessArea, string> = {
  client_portal: "Client Portal",
  team_portal: "Team Portal",
  media_workflow: "Media workflow",
  client_requests: "Client requests",
  client_updates: "Client updates",
  reports: "Reports",
  workflow_tracking: "Workflow tracking",
  approval_gates: "Review gates",
  data_readiness: "Account data readiness",
  launch_guardrails: "Launch guardrails",
  pricing_alignment: "Pricing alignment",
  role_separation: "Role separation",
  service_boundaries: "Service boundaries",
};

const clientSafeMessages: Record<ReadinessStatus, string> = {
  passing: READINESS_SAFE_COPY.readyForFirstClientReview,
  warning: READINESS_SAFE_COPY.asksForNext,
  failing: READINESS_SAFE_COPY.needsSetupBeforeLaunch,
  blocked: READINESS_SAFE_COPY.manualReviewRequired,
  caution: READINESS_SAFE_COPY.asksForNext,
  ready_for_review: READINESS_SAFE_COPY.readyForFirstClientReview,
  ready: READINESS_SAFE_COPY.nothingLiveWithoutReview,
};

export function getReadinessStatusLabel(status: ReadinessStatus): string {
  return statusLabels[status];
}

export function getReadinessSeverityLabel(severity: ReadinessSeverity): string {
  return severityLabels[severity];
}

export function getReadinessAreaLabel(area: ReadinessArea): string {
  return areaLabels[area];
}

export function getClientSafeReadinessMessage(status: ReadinessStatus): string {
  return clientSafeMessages[status];
}
