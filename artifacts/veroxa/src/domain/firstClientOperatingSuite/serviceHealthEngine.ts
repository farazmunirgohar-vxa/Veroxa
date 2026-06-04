import type { FirstClientOperatingSeed, MediaRhythmStatus, OnboardingReadinessStatus, ServiceHealthStatus } from "./types";

export function evaluateServiceHealth(params: {
  seed: FirstClientOperatingSeed;
  onboardingStatus: OnboardingReadinessStatus;
  mediaRhythmStatus: MediaRhythmStatus;
  blockers: readonly string[];
}): ServiceHealthStatus {
  const { seed, onboardingStatus, mediaRhythmStatus, blockers } = params;
  if (seed.servicePaused) return "paused";
  if (blockers.length >= 3) return "blocked";
  if (seed.clientConfirmationStatus === "needed") return "review_needed";
  if (mediaRhythmStatus.contentSupplyStatus === "blocked") return "urgent";
  if (onboardingStatus.status === "needed") return "urgent";
  if (mediaRhythmStatus.contentSupplyStatus === "low" || blockers.length > 0)
    return "caution";
  return "healthy";
}

export function getServiceHealthLabel(status: ServiceHealthStatus): string {
  const labels: Record<ServiceHealthStatus, string> = {
    healthy: "Healthy",
    caution: "Caution",
    urgent: "Urgent",
    blocked: "Blocked",
    paused: "Paused",
    review_needed: "Review needed",
  };
  return labels[status];
}
